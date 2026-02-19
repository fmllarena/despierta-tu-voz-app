import { state, updateState } from '../modules/state.js';
import { ELEMENTS } from '../modules/elements.js';
import { alertCustom } from '../modules/utils.js';
import { llamarGemini } from './ai-service.js';

/**
 * Carga el perfil del usuario desde el backend.
 */
export async function cargarPerfil(user) {
    try {
        const response = await fetch('/api/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
        });
        const perfil = await response.json();

        if (perfil.error) {
            console.error("⚠️ Error cargando/creando perfil:", perfil.error);
            return null;
        }

        updateState({ userProfile: perfil });
        window.userProfile = perfil; // Mantener compatibilidad temporal

        // Calentamiento silencioso
        llamarGemini("", [], "warmup", { userId: user.id }).catch(() => { });

        return perfil;
    } catch (e) {
        console.error("Error crítico en cargarPerfil:", e);
        return null;
    }
}

/**
 * Carga los últimos mensajes de la DB para el historial de la IA.
 */
export async function cargarHistorialDesdeDB(userId) {
    if (!state.supabase) return [];

    try {
        const { data: mensajes, error } = await state.supabase
            .from('mensajes')
            .select('*')
            .eq('alumno', userId)
            .order('created_at', { ascending: false })
            .limit(15);

        if (error) {
            console.error("Error Supabase (select):", error);
            return [];
        }

        if (!mensajes || mensajes.length === 0) return [];

        const history = mensajes.reverse().map(msg => ({
            role: msg.emisor === 'ia' ? 'model' : 'user',
            parts: [{ text: msg.texto }]
        }));

        updateState({ chatHistory: history });
        return history;
    } catch (e) {
        console.error("Error crítico recuperando historial:", e);
        return [];
    }
}

/**
 * Guarda un mensaje en la base de datos.
 */
export async function guardarMensajeDB(texto, emisor, customDate = null) {
    try {
        const { data: { user } } = await state.supabase.auth.getUser();
        if (!user) return;

        const payload = {
            texto: texto,
            emisor: emisor,
            alumno: user.id
        };

        if (customDate) payload.created_at = customDate;

        const { error } = await state.supabase.from('mensajes').insert(payload);

        if (error) {
            console.error("Error Supabase (insert):", error);
        } else {
            // Actualizar actividad
            await state.supabase
                .from('user_profiles')
                .update({
                    last_active_at: new Date().toISOString(),
                    email_inactividad_10_enviado: false
                })
                .eq('user_id', user.id);
        }
    } catch (e) {
        console.error("Error crítico guardando mensaje:", e);
    }
}
