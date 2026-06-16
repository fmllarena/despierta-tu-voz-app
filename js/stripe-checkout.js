// stripe-checkout.js

// --- CONFIGURACIÓN DE SUPABASE ---
let supabasePagos;
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
inicializarSupabase().then(() => {
    resumePurchaseFlow();
});

/**
 * Reanuda el flujo de compra si venimos de un redirect (OAuth)
 */
async function resumePurchaseFlow() {
    const pendingPlan = sessionStorage.getItem('pendingPlan');
    if (!pendingPlan) return;

    console.log("🔄 Reanudación activa: detectado plan en espera:", pendingPlan);

    if (!supabasePagos) await inicializarSupabase();

    // Escuchar el cambio de estado para reanudar en cuanto la sesión sea válida
    const { data: { subscription } } = supabasePagos.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
            if (session?.user) {
                console.log("✅ Sesión detectada, reanudando pago para:", pendingPlan);
                const planToResume = sessionStorage.getItem('pendingPlan');
                if (planToResume) {
                    sessionStorage.removeItem('pendingPlan');
                    subscription.unsubscribe(); // Dejar de escuchar una vez reanudado
                    await iniciarPago(planToResume);
                }
            }
        }
    });

    // Fallback por si la sesión ya estaba ahí y no dispara evento inicial
    const { data: { user } } = await supabasePagos.auth.getUser();
    if (user) {
        console.log("✅ Usuario ya presente, ejecutando reanudación directa.");
        sessionStorage.removeItem('pendingPlan');
        subscription.unsubscribe();
        await iniciarPago(pendingPlan);
    }
}

/**
 * Función para iniciar el pago con Stripe
 */
async function iniciarPago(planType) {
    if (planType === 'free') {
        window.location.href = "index.html";
        return;
    }

    if (!supabasePagos) await inicializarSupabase();
    const { data: { user } } = await supabasePagos.auth.getUser();

    if (!user) {
        const landingAuthModal = document.getElementById('authLandingModal');
        if (landingAuthModal) {
            window.pendingPlan = planType;
            landingAuthModal.style.display = 'flex';
            setupLandingAuthListeners();
            return;
        }
        window.location.href = "index.html?auth=required";
        return;
    }

    const isAccepted = window.getAcceptedTermsStatus ? window.getAcceptedTermsStatus() : (window.userProfile?.accepted_terms || false);
    if (!isAccepted) {
        if (window.mostrarModalLegal) {
            window.mostrarModalLegal(planType);
            return;
        }
        const legalModal = document.getElementById('legalLandingModal') || document.getElementById('legalModal');
        if (legalModal) {
            window.pendingPlan = planType;
            legalModal.style.display = 'flex';
            if (document.getElementById('legalLandingModal')) setupLandingLegalListeners(user);
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

    let isLoginMode = false;

    // DEFINIMOS LA FUNCIÓN FUERA DEL IF PARA QUE SEA ACCESIBLE SIEMPRE
    const setMode = (login) => {
        isLoginMode = login;
        if (authTitle) authTitle.innerText = login ? "Bienvenido de nuevo" : "Comienza tu Transformación";
        if (authIntro) authIntro.innerText = login ? "Inicia sesión para continuar con tu compra." : "Crea tu cuenta para guardar tu progreso y acceder a tu Mentor Vocal.";
        if (btnRegister) btnRegister.innerText = login ? "Entrar y Continuar" : "Registrarme y Continuar";
        if (toggleToLogin) toggleToLogin.style.display = login ? "none" : "inline";
        if (toggleToRegister) toggleToRegister.style.display = login ? "inline" : "none";

        const nameGroup = document.getElementById('landingNameGroup');
        if (nameGroup) nameGroup.style.display = login ? "none" : "block";

        const forgotWrap = document.getElementById('landingForgotPassWrap');
        if (forgotWrap) forgotWrap.style.display = login ? "block" : "none";

        if (errorDiv) errorDiv.style.display = 'none';
        if (btnRegister) btnRegister.disabled = false;
    };

    // Forzamos el modo registro al abrir, independientemente de si los listeners ya existen
    console.log("🛠️ Configurando Modal Auth: Forzando Modo Registro (setMode: false)");
    setMode(false);

    // Aseguramos que el campo sea visible explícitamente por si acaso
    const nameGroupFallback = document.getElementById('landingNameGroup');
    if (nameGroupFallback) {
        nameGroupFallback.style.setProperty('display', 'block', 'important');
        console.log("✅ Campo NOMBRE forzado a block");
    }

    if (!btnRegister || btnRegister.dataset.listenerSet) {
        console.log("ℹ️ Listeners ya configurados, omitiendo adjunción.");
        return;
    }

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
                const nombre = document.getElementById('landingName').value.trim();
                if (!nombre) {
                    throw new Error("Por favor, dinos tu nombre para el Mentor.");
                }
                result = await supabasePagos.auth.signUp({
                    email,
                    password,
                    options: {
                        data: { nombre: nombre },
                        emailRedirectTo: window.location.origin + '/index.html'
                    }
                });
            }

            if (result.error) throw result.error;

            if (result.data.user) {
                const user = result.data.user;
                if (!isLoginMode && user.identities && user.identities.length === 0) {
                    throw new Error("Este correo ya está registrado. Por favor, selecciona 'Inicia sesión'.");
                } else if (!user.email_confirmed_at) {
                    // SI NO HA CONFIRMADO EMAIL, MOSTRAMOS EL NUEVO MODAL DE VERIFICACIÓN
                    document.getElementById('authLandingModal').style.display = 'none';
                    const verificationModal = document.getElementById('verificationLandingModal');
                    if (verificationModal) {
                        verificationModal.style.display = 'flex';
                        setupLandingVerificationListeners(user);
                    } else {
                        // Fallback por si el modal no existe, al menos le avisamos
                        alert("Por favor, confirma tu correo electrónico para continuar.");
                    }
                } else {
                    document.getElementById('authLandingModal').style.display = 'none';
                    const legalModal = document.getElementById('legalLandingModal');
                    if (legalModal) {
                        legalModal.style.display = 'flex';
                        setupLandingLegalListeners(user);
                    }
                }
            }
        } catch (e) {
            errorDiv.innerText = e.message || "Error al procesar el acceso.";
            errorDiv.style.display = 'block';
        } finally {
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
                errorDiv.innerText = "Introduce tu email para enviarte el enlace.";
                errorDiv.style.display = 'block';
                return;
            }
            try {
                if (!supabasePagos) await inicializarSupabase();
                const { error } = await supabasePagos.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin + '/index.html'
                });
                if (error) throw error;
                alert("Correo de recuperación enviado.");
            } catch (err) {
                errorDiv.innerText = "Error: " + err.message;
                errorDiv.style.display = 'block';
            }
        });
    }

    btnRegister.dataset.listenerSet = "true";
}

let verificationPollingInterval = null;

function setupLandingVerificationListeners(user) {
    const btnResend = document.getElementById('btnResendVerification');
    const btnCheck = document.getElementById('btnCheckVerification');
    const errorDiv = document.getElementById('verificationError');

    // Limpiar intervalo anterior si existe
    if (verificationPollingInterval) clearInterval(verificationPollingInterval);

    // FUNCIÓN DE COMPROBACIÓN (POLLING)
    const checkVerificationStatus = async () => {
        try {
            if (!supabasePagos) await inicializarSupabase();
            const { data, error } = await supabasePagos.auth.getUser();

            if (error) throw error;

            if (data?.user?.email_confirmed_at) {
                console.log("✅ Email confirmado detectado vía polling.");
                clearInterval(verificationPollingInterval);
                document.getElementById('verificationLandingModal').style.display = 'none';

                const legalModal = document.getElementById('legalLandingModal');
                if (legalModal) {
                    legalModal.style.display = 'flex';
                    setupLandingLegalListeners(data.user);
                }
            }
        } catch (e) {
            console.error("Error en polling de verificación:", e);
        }
    };

    // Polling cada 5 segundos
    verificationPollingInterval = setInterval(checkVerificationStatus, 5000);

    // BOTÓN: YA HE VERIFICADO (Manual)
    if (btnCheck) {
        btnCheck.onclick = async () => {
            btnCheck.disabled = true;
            btnCheck.innerText = "Comprobando...";
            await checkVerificationStatus();
            const { data } = await supabasePagos.auth.getUser();
            if (!data?.user?.email_confirmed_at) {
                if (errorDiv) {
                    errorDiv.innerText = "Aún no detectamos la confirmación. Por favor, pulsa el enlace en tu email.";
                    errorDiv.style.display = 'block';
                }
                btnCheck.disabled = false;
                btnCheck.innerText = "Ya he verificado";
            }
        };
    }

    // BOTÓN: REENVIAR EMAIL
    if (btnResend) {
        btnResend.onclick = async () => {
            btnResend.disabled = true;
            btnResend.innerText = "Enviando...";
            try {
                const { error } = await supabasePagos.auth.resend({
                    type: 'signup',
                    email: user.email,
                    options: {
                        emailRedirectTo: window.location.origin + '/index.html'
                    }
                });
                if (error) throw error;
                alert("Email de confirmación reenviado. Revisa tu bandeja de entrada.");
            } catch (e) {
                alert("Error al reenviar: " + e.message);
            } finally {
                btnResend.disabled = false;
                btnResend.innerText = "Reenviar Email";
            }
        };
    }
}

function setupLandingLegalListeners(user) {
    const checkTerms = document.getElementById('checkTermsLanding');
    const checkMedical = document.getElementById('checkMedicalLanding');
    const btnConfirm = document.getElementById('btnConfirmLegalLanding');

    if (!btnConfirm) return;

    const validate = () => {
        btnConfirm.disabled = !(checkTerms?.checked && checkMedical?.checked);
    };

    checkTerms?.addEventListener('change', validate);
    checkMedical?.addEventListener('change', validate);

    // Evitar duplicar el listener del botón
    if (btnConfirm.dataset.listenerSet) return;

    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirm.innerText = "Conectando con pasarela segura... 🛡️";

        try {
            // Actualizar perfil
            const { error } = await supabasePagos
                .from('user_profiles')
                .update({ accepted_terms: true })
                .eq('user_id', user.id);

            if (error) throw error;

            // Avanzar al pago
            document.getElementById('legalLandingModal').style.display = 'none';
            if (window.pendingPlan) {
                await ejecutarPago(window.pendingPlan, user);
            }
        } catch (e) {
            console.error("Error legal:", e);
            alert("Hubo un error al registrar tu aceptación. Inténtalo de nuevo.");
            btnConfirm.disabled = false;
            btnConfirm.innerText = "¡Empezar mi viaje! ✨";
        }
    });

    btnConfirm.dataset.listenerSet = "true";
}

async function ejecutarPago(planType, user) {
    const promoCode = sessionStorage.getItem('dtv_promo_code');

    // CASO ESPECIAL: PROMO1MES (1 Mes Gratis Sin Tarjeta)
    // No pasamos por Stripe, activamos directamente
    if (promoCode === 'PROMO1MES' && planType === 'pro') {
        try {
            console.log("🎁 Activando PROMO1MES sin tarjeta...");
            const response = await fetch('/api/redeem-promo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: promoCode,
                    userId: user.id
                }),
            });

            const result = await response.json();
            if (result.success) {
                // Redirigir directamente al chat con éxito
                window.location.href = '/index.html?payment=success&plan=pro&promo=active';
            } else {
                alert("Error al activar la promoción: " + (result.error || "Desconocido"));
            }
            return;
        } catch (e) {
            console.error("Error en activación promo:", e);
            alert("Error de red al intentar activar tu promoción.");
            return;
        }
    }

    // FLUJO NORMAL: Stripe Checkout
    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'checkout',
                priceId: planType,
                userId: user.id,
                userEmail: user.email,
                promoCode: promoCode
            }),
        });

        const session = await response.json();
        if (session.url) {
            window.location.href = session.url;
        } else {
            alert("Error al iniciar el pago: " + (session.error || "Desconocido"));
        }
    } catch (e) {
        console.error("Error en ejecutarPago:", e);
        alert("Error de red al intentar conectar con la pasarela de pago.");
    }
}

// Inicializar Supabase si es necesario
window.ejecutarPagoPostLegal = (planType) => {
    supabasePagos.auth.getUser().then(({ data: { user } }) => {
        if (user) ejecutarPago(planType, user);
    });
};
