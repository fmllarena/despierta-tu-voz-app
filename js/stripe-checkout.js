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

            // Si es la landing, necesitamos configurar los listeners aquí o asegurar que existan
            if (document.getElementById('legalLandingModal')) {
                setupLandingLegalListeners();
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
    if (!btnRegister || btnRegister.dataset.listenerSet) return;

    btnRegister.addEventListener('click', async () => {
        const email = document.getElementById('landingEmail').value.trim();
        const password = document.getElementById('landingPassword').value;
        const errorDiv = document.getElementById('landingAuthError');

        if (!email || !password) {
            errorDiv.innerText = "Por favor, completa todos los campos.";
            errorDiv.style.display = 'block';
            return;
        }

        btnRegister.disabled = true;
        btnRegister.innerText = "Registrando...";

        try {
            if (!supabasePagos) await inicializarSupabase();
            const { data, error } = await supabasePagos.auth.signUp({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Registro exitoso. Cerramos auth y abrimos legal.
                document.getElementById('authLandingModal').style.display = 'none';
                const legalModal = document.getElementById('legalLandingModal');
                if (legalModal) {
                    legalModal.style.display = 'flex';
                    setupLandingLegalListeners();
                }
            }
        } catch (e) {
            console.error("Error en registro landing:", e);
            errorDiv.innerText = e.message || "Error al registrarse.";
            errorDiv.style.display = 'block';
            btnRegister.disabled = false;
            btnRegister.innerText = "Registrarme y Continuar";
        }
    });
    btnRegister.dataset.listenerSet = "true";
}

function setupLandingLegalListeners() {
    const btnConfirm = document.getElementById('btnConfirmLegalLanding');
    const check1 = document.getElementById('checkTermsLanding');
    const check2 = document.getElementById('checkMedicalLanding');

    if (!btnConfirm || btnConfirm.dataset.listenerSet) return;

    const validate = () => {
        btnConfirm.disabled = !(check1.checked && check2.checked);
    };

    check1.addEventListener('change', validate);
    check2.addEventListener('change', validate);

    btnConfirm.addEventListener('click', async () => {
        btnConfirm.disabled = true;
        btnConfirm.innerText = "Procesando...";

        try {
            if (!supabasePagos) await inicializarSupabase();
            const { data: { user } } = await supabasePagos.auth.getUser();

            if (user) {
                // Guardar aceptación en Supabase
                const { error } = await supabasePagos
                    .from('user_profiles')
                    .update({ accepted_terms: true })
                    .eq('user_id', user.id);

                if (error) throw error;

                // Continuar al pago
                document.getElementById('legalLandingModal').style.display = 'none';
                await ejecutarPago(window.pendingPlan, user);
            }
        } catch (e) {
            console.error("Error legal landing:", e);
            alert("Error al procesar el consentimiento.");
            btnConfirm.disabled = false;
            btnConfirm.innerText = "Confirmar y Pagar";
        }
    });
    btnConfirm.dataset.listenerSet = "true";
}

/**
 * Función que realmente realiza la llamada a la API de Stripe
 */
async function ejecutarPago(planType, user) {
    try {
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
            console.error("Error en la sesión de Stripe:", session.error);
            alert("Hubo un error al procesar el pago. Inténtalo de nuevo.");
        }
    } catch (e) {
        console.error("Error de red:", e);
        alert("Error de conexión con el servidor de pagos.");
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
