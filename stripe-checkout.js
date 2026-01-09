// stripe-checkout.js

// --- CONFIGURACIÓN DE SUPABASE ---
let supabase;
async function inicializarSupabase() {
    if (supabase) return supabase; // Ya inicializado

    try {
        console.log("🔍 Inicializando Supabase para pagos...");
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error(`Error en config: ${response.statusText}`);

        const config = await response.json();

        // El script de Supabase del CDN expone 'supabase' en el scope global
        if (window.supabase && typeof window.supabase.createClient === 'function') {
            supabase = window.supabase.createClient(config.url, config.key);
            console.log("✅ Supabase inicializado correctamente.");
            return supabase;
        } else {
            throw new Error("El SDK de Supabase no se cargó correctamente.");
        }
    } catch (e) {
        console.error("❌ Error cargando Supabase en Landing:", e);
    }
}

// Intentar inicializar nada más cargar
inicializarSupabase();

/**
 * Función para iniciar el pago con Stripe
 * @param {string} planType - 'pro' o 'premium' o 'free'
 */
async function iniciarPago(planType) {
    console.log(`🚀 Iniciando proceso para plan: ${planType}`);

    if (planType === 'free') {
        window.location.href = "index.html";
        return;
    }

    // 1. Aseguramos Supabase
    if (!supabase) {
        supabase = await inicializarSupabase();
    }

    if (!supabase) {
        alert("Error de conexión. Por favor, recarga la página.");
        return;
    }

    // 2. Obtenemos el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.log("No hay usuario autenticado. Redirigiendo...");
        alert("Para elegir un plan, primero debes entrar en tu cuenta o registrarte (es gratis).");
        window.location.href = "index.html?auth=required";
        return;
    }

    try {
        console.log(`💳 Solicitando sesión de Stripe para ${user.email}...`);
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
            console.log("✅ Redirigiendo a Stripe Checkout...");
            window.location.href = session.url;
        } else {
            console.error("❌ Error en la sesión de Stripe:", session.error);
            alert("Vaya, parece que hay un problema con la conexión de pagos: " + (session.error || "Error desconocido"));
        }
    } catch (e) {
        console.error("❌ Error de red fatal:", e);
        alert("Error de conexión con el servidor. Por favor, comprueba tu internet.");
    }
}

// Exportar a global para que index.html lo vea siempre
window.iniciarPago = iniciarPago;
window.inicializarSupabasePagos = inicializarSupabase;
