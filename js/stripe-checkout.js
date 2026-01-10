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
        alert("Debes iniciar sesión o registrarte para elegir un plan Pro/Premium. Te redirigimos al acceso.");
        window.location.href = "index.html?auth=required";
        return;
    }

    // 2. Comprobar consentimiento legal
    const isAccepted = window.getAcceptedTermsStatus ? window.getAcceptedTermsStatus() : true;
    if (!isAccepted) {
        // Pausar pago y mostrar modal legal
        if (window.mostrarModalLegal) {
            window.mostrarModalLegal(planType);
            return;
        }
    }

    await ejecutarPago(planType, user);
}

/**
 * Función que realmente realiza la llamada a la API de Stripe
 * Se separa para poder re-intentar tras el consentimiento legal.
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
