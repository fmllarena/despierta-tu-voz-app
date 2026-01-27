// stripe-checkout.js

// --- CONFIGURACIÓN DE SUPABASE ---
let supabasePagos; // Renombrado para evitar conflictos con la librería global (SyntaxError)
async function inicializarSupabase() {
    try {
        const response = await fetch('/api/config');
        const config = await response.json();
        if (window.supabase) {
            supabasePagos = window.supabase.createClient(config.url, config.key);
        }
    } catch (e) {
        console.error("Error cargando Supabase en Landing:", e);
    }
}
inicializarSupabase();

/**
 * Función para iniciar el pago con Stripe
 * @param {string} planType - 'pro' o 'premium' o 'free'
 */
async function iniciarPago(planType) {
    if (planType === 'free') {
        window.location.href = "index.html";
        return;
    }

    // 1. Obtenemos el usuario actual
    if (!supabasePagos) {
        await inicializarSupabase();
    }

    const { data: { user } } = await supabasePagos.auth.getUser();

    if (!user) {
        // En la landing, mostramos el modal amable en lugar de redirigir bruscamente
        const landingAuthModal = document.getElementById('authLandingModal');
        if (landingAuthModal) {
            window.pendingPlan = planType;
            landingAuthModal.style.display = 'flex';
            setupLandingAuthListeners();
            return;
        }
        alert("Debes iniciar sesión o registrarte para elegir un plan Pro/Premium. Te redirigimos al acceso.");
        window.location.href = "index.html?auth=required";
        return;
    }

    // 2. Comprobar consentimiento legal
    const isAccepted = window.getAcceptedTermsStatus ? window.getAcceptedTermsStatus() : (user.accepted_terms || false);

    if (!isAccepted) {
        // Pausar pago y mostrar modal legal
        const legalModal = document.getElementById('legalLandingModal') || document.getElementById('legalModal');
        if (legalModal) {
            window.pendingPlan = planType;
            legalModal.style.display = 'flex';

            // Control de visibilidad de los términos de promoción
            const promoBox = legalModal.querySelector('.promo-terms-box') || document.getElementById('promoTermsBox');
            if (promoBox) {
                const promo = sessionStorage.getItem('dtv_promo_code');
                promoBox.style.display = promo ? 'block' : 'none';
            }

            // Si es la landing, necesitamos configurar los listeners aquí o asegurar que existan
            if (document.getElementById('legalLandingModal')) {
                setupLandingLegalListeners(user);
            }
            return;
        }
    }

    await ejecutarPago(planType, user);
}

/**
 * Lógica específica para la Landing Page
 */
function setupLandingAuthListeners() {
    const btnRegister = document.getElementById('btnLandingRegister');
    const toggleToLogin = document.getElementById('toggleToLogin');
    const toggleToRegister = document.getElementById('toggleToRegister');
    const authTitle = document.getElementById('landingAuthTitle');
    const authIntro = document.getElementById('landingAuthIntro');
    const errorDiv = document.getElementById('landingAuthError');

    if (!btnRegister || btnRegister.dataset.listenerSet) return;

    let isLoginMode = false;

    const setMode = (login) => {
        isLoginMode = login;
        authTitle.innerText = login ? "Bienvenido de nuevo" : "Comienza tu Transformación";
        authIntro.innerText = login ? "Inicia sesión para continuar con tu compra." : "Crea tu cuenta para guardar tu progreso y acceder a tu Mentor Vocal.";
        btnRegister.innerText = login ? "Entrar y Continuar" : "Registrarme y Continuar";
        toggleToLogin.style.display = login ? "none" : "inline";
        toggleToRegister.style.display = login ? "inline" : "none";
        // Mostrar link de olvido de pass solo en modo login
        const forgotWrap = document.getElementById('landingForgotPassWrap');
        if (forgotWrap) forgotWrap.style.display = login ? "block" : "none";
        errorDiv.style.display = 'none';
        btnRegister.disabled = false;
    };

    if (toggleToLogin) toggleToLogin.addEventListener('click', () => setMode(true));
    if (toggleToRegister) toggleToRegister.addEventListener('click', () => setMode(false));

    btnRegister.addEventListener('click', async () => {
        const email = document.getElementById('landingEmail').value.trim();
        const password = document.getElementById('landingPassword').value;

        if (!email || !password) {
            errorDiv.innerText = "Por favor, completa todos los campos.";
            errorDiv.style.display = 'block';
            return;
        }

        btnRegister.disabled = true;
        btnRegister.innerText = isLoginMode ? "Entrando..." : "Registrando...";
        errorDiv.style.display = 'none';

        try {
            if (!supabasePagos) await inicializarSupabase();

            let result;
            if (isLoginMode) {
                result = await supabasePagos.auth.signInWithPassword({ email, password });
            } else {
                result = await supabasePagos.auth.signUp({ email, password });
            }

            if (result.error) throw result.error;

            if (result.data.user) {
                const user = result.data.user;
                const isExistingUserOnRegister = !isLoginMode && user.identities && user.identities.length === 0;

                if (isExistingUserOnRegister) {
                    errorDiv.innerText = "Este correo ya está registrado. Por favor, selecciona 'Inicia sesión' arriba.";
                    errorDiv.style.display = 'block';
                    btnRegister.disabled = false;
                    btnRegister.innerText = "Registrarme y Continuar";
                } else {
                    // Éxito (Login o Registro nuevo)
                    document.getElementById('authLandingModal').style.display = 'none';
                    const legalModal = document.getElementById('legalLandingModal');
                    if (legalModal) {
                        legalModal.style.display = 'flex';
                        setupLandingLegalListeners(user);
                    }
                }
            } else {
                throw new Error("No se pudo establecer la sesión.");
            }
        } catch (e) {
            console.error("Error en auth landing:", e);
            errorDiv.innerText = e.message || "Error al procesar el acceso.";
            errorDiv.style.display = 'block';
            btnRegister.disabled = false;
            btnRegister.innerText = isLoginMode ? "Entrar y Continuar" : "Registrarme y Continuar";
        }
    });

    const forgotBtn = document.getElementById('landingForgotPassLink');
    if (forgotBtn) {
        forgotBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.getElementById('landingEmail').value.trim();
            if (!email) {
                errorDiv.innerText = "Introduce tu email para enviarte el enlace de recuperación.";
                errorDiv.style.display = 'block';
                return;
            }
            try {
                if (!supabasePagos) await inicializarSupabase();
                const { error } = await supabasePagos.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/index.html'
                });
                if (error) throw error;
                alert("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
            } catch (err) {
                errorDiv.innerText = "Error: " + err.message;
                errorDiv.style.display = 'block';
            }
        });
    }

    btnRegister.dataset.listenerSet = "true";
}

/**
 * Listeners para el modal legal de la landing
 * @param {Object} passedUser - El usuario obtenido tras login/registro (opcional)
 */
function setupLandingLegalListeners(passedUser = null) {
    const btnConfirm = document.getElementById('btnConfirmLegalLanding');
    const check1 = document.getElementById('checkTermsLanding');
    const check2 = document.getElementById('checkMedicalLanding');

    if (!btnConfirm || btnConfirm.dataset.listenerSet) return;

    let currentUser = passedUser;

    const validate = () => {
        btnConfirm.disabled = !(check1.checked && check2.checked);
    };

    check1.addEventListener('change', validate);
    check2.addEventListener('change', validate);

    btnConfirm.addEventListener('click', async () => {
        console.log("Iniciando procesamiento legal en Landing...");
        btnConfirm.disabled = true;
        btnConfirm.innerText = "Procesando...";

        try {
            if (!supabasePagos) await inicializarSupabase();

            // Intentar obtener usuario de múltiples fuentes para máxima robustez
            if (!currentUser) {
                const { data: { user: authUser } } = await supabasePagos.auth.getUser();
                currentUser = authUser;
            }

            // Si sigue sin haber usuario, intentamos getSession
            if (!currentUser) {
                const { data: { session } } = await supabasePagos.auth.getSession();
                currentUser = session?.user;
            }

            if (currentUser) {
                console.log("Usuario detectado para confirmación:", currentUser.id);

                if (!window.pendingPlan) {
                    console.error("Error: window.pendingPlan es null");
                    throw new Error("No se ha detectado el plan seleccionado. Por favor, cierra este aviso y vuelve a pulsar el botón del plan.");
                }

                // Intentar actualizar el perfil (con reintentos leves si el trigger tarda)
                let updateSuccess = false;
                let attempts = 0;

                while (!updateSuccess && attempts < 4) {
                    console.log(`Intento de actualización de perfil ${attempts + 1}...`);
                    const { error } = await supabasePagos
                        .from('user_profiles')
                        .update({ accepted_terms: true })
                        .eq('user_id', currentUser.id);

                    if (!error) {
                        updateSuccess = true;
                        console.log("Perfil actualizado con éxito.");
                    } else {
                        console.warn(`Intento ${attempts + 1} fallido:`, error.message);
                        attempts++;
                        if (attempts < 4) await new Promise(r => setTimeout(r, 800));
                    }
                }

                if (!updateSuccess) {
                    throw new Error("No pudimos actualizar tu perfil de consentimiento. Por favor, inténtalo de nuevo en unos segundos.");
                }

                // Continuar al pago
                console.log("Procediendo a ejecutar con el plan:", window.pendingPlan);
                await ejecutarPago(window.pendingPlan, currentUser);

                // Ocultamos el modal solo si no ha habido error arriba
                document.getElementById('legalLandingModal').style.display = 'none';
            } else {
                throw new Error("Sesión no encontrada. Por favor, inicia sesión de nuevo.");
            }
        } catch (e) {
            console.error("Error crítico en legal landing:", e);
            alert(e.message || "Error al procesar el consentimiento.");
            // Restauramos el botón solo en caso de error
            btnConfirm.disabled = false;
            btnConfirm.innerText = "Confirmar y Seguir";
        }
    });
    btnConfirm.dataset.listenerSet = "true";
}

/**
 * Función que realmente realiza la llamada a la API de Stripe
 */
async function ejecutarPago(planType, user) {
    try {
        const promo = sessionStorage.getItem('dtv_promo_code');

        // --- NUEVA LÓGICA: CANJE SIN TARJETA ---
        if (promo && planType === 'pro') {
            const confirmPromo = confirm(`🎁 ¡Buenas noticias! Tienes un código de promoción: ${promo}.\n\n¿Quieres activar tu mes gratis del Plan Pro ahora mismo sin necesidad de tarjeta?`);

            if (confirmPromo) {
                const response = await fetch('/api/redeem-promo', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: promo, userId: user.id })
                });

                const data = await response.json();
                if (data.success) {
                    alert("✨ ¡Enhorabuena! Tu mes gratis ha sido activado. Ya tienes acceso a todas las funciones Pro.");
                    sessionStorage.removeItem('dtv_promo_code');
                    window.location.href = "index.html";
                    return;
                } else {
                    const errorMsg = data.error || "Desconocido";
                    const details = data.details ? `\nDetalles: ${data.details}` : "";
                    alert(`Error con el código: ${errorMsg}${details}`);
                    // Si falla el código, dejamos que intente el pago normal por si acaso
                }
            }
        }

        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                priceId: planType,
                userId: user.id,
                userEmail: user.email
            }),
        });

        const session = await response.json();

        if (session.url) {
            window.location.href = session.url;
        } else {
            throw new Error(session.error || "Hubo un error al procesar el pago.");
        }
    } catch (e) {
        console.error("Error en ejecutarPago:", e);
        throw e; // Re-lanzar para que el llamador pueda resetear la UI
    }
}

// Función global para que main.js la llame tras aceptar el modal legal
window.ejecutarPagoPostLegal = async (planType) => {
    if (!supabasePagos) await inicializarSupabase();
    const { data: { user } } = await supabasePagos.auth.getUser();
    if (user) {
        await ejecutarPago(planType, user);
    }
};

// Aseguramos que sea accesible desde el modal del chat
window.iniciarPago = iniciarPago;
