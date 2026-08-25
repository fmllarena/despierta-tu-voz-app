import { updateState } from '../modules/state.js';

/**
 * Obtiene la configuración de Supabase desde el servidor e inicializa el cliente.
 */
export async function inicializarSupabase() {
    if (state.supabase) return state.supabase;
    console.log("🔍 Inicializando Supabase...");
    try {
        const response = await fetch('/api/config');
        if (!response.ok) throw new Error("Error cargando config.");

        const config = await response.json();
        if (!config.url || !config.key) throw new Error("Configuración incompleta.");

        if (window.supabase) {
            const sb = window.supabase.createClient(config.url, config.key);
            updateState({ supabase: sb });
            console.log("✅ Supabase listo.");
            return sb;
        } else {
            throw new Error("Librería Supabase no encontrada.");
        }
    } catch (e) {
        console.error("❌ Error Supabase:", e);
        window.supabaseInitError = e.message;
        return null;
    }
}

// Exponer para que el script clásico main.js pueda inicializar el cliente único
window.inicializarSupabase = inicializarSupabase;
