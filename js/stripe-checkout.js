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
inicializarSupabase();

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

    const isAccepted = window.getAcceptedTermsStatus ? window.getAcceptedTermsStatus() : (user.accepted_terms || false);
    if (!isAccepted) {
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
    try {
        const response = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                priceId: planType,
                userId: user.id,
                userEmail: user.email,
                promoCode: sessionStorage.getItem('dtv_promo_code')
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
