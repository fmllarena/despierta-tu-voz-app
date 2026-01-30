import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const TEMPLATE_DAY_15 = 9
const TEMPLATE_DAY_23 = 8
const TEMPLATE_INACTIVITY_10 = 15
const TEMPLATE_POST_JOURNEY_5 = 16

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log("Edge Function 'daily-retention-job' (v4.1) - Unified Automation & Quota Reset");

serve(async (req) => {
    try {
        const results = [];

        // --- 0. RESET MENSUAL DE CUOTAS (SESIONES 1/1) ---
        const today = new Date();
        const { data: globalState } = await supabase
            .from('user_profiles')
            .select('last_session_reset')
            .limit(1)
            .single();

        const lastReset = globalState?.last_session_reset ? new Date(globalState.last_session_reset) : null;

        // Si no hay reset previo o estamos en un mes diferente al último reset
        if (!lastReset || (today.getMonth() !== lastReset.getMonth()) || (today.getFullYear() !== lastReset.getFullYear())) {
            console.log("[Job] Ejecutando reset mensual de cuotas de sesiones...");
            const { error: resetError } = await supabase
                .from('user_profiles')
                .update({
                    sessions_minutes_consumed: 0,
                    last_session_reset: today.toISOString()
                })
                .neq('sessions_minutes_consumed', 0); // Solo los que han consumido algo

            if (resetError) console.error("Error en reset mensual:", resetError);
            else results.push({ stage: 'Reset Mensual', status: 'completed' });
        }

        // --- 1. PROCESAR DÍA 15 (Check-in Nuevos Usuarios) ---
        const date15 = new Date();
        date15.setDate(date15.getDate() - 15);
        const iso15 = date15.toISOString();

        const { data: users15 } = await supabase
            .from('user_profiles')
            .select('user_id, email, nombre, created_at')
            .eq('email_retencion_15_enviado', false)
            .lte('created_at', iso15);

        if (users15 && users15.length > 0) {
            console.log(`[Job] Enviando Día 15 a ${users15.length} usuarios...`);
            for (const user of users15) {
                const res = await sendBrevoEmail(user, TEMPLATE_DAY_15);
                if (res.ok) {
                    await supabase.from('user_profiles').update({ email_retencion_15_enviado: true }).eq('user_id', user.user_id);
                    results.push({ email: user.email, stage: 'Retención 15', status: 'sent' });
                }
            }
        }

        // --- 2. PROCESAR DÍA 23 (Fin de Ciclo) ---
        const date23 = new Date();
        date23.setDate(date23.getDate() - 23);
        const iso23 = date23.toISOString();

        const { data: users23 } = await supabase
            .from('user_profiles')
            .select('user_id, email, nombre, created_at')
            .eq('email_retencion_23_enviado', false)
            .lte('created_at', iso23);

        if (users23 && users23.length > 0) {
            console.log(`[Job] Enviando Día 23 a ${users23.length} usuarios...`);
            for (const user of users23) {
                const regDate = new Date(user.created_at);
                const expDate = new Date(regDate.getTime() + (30 * 24 * 60 * 60 * 1000));
                const expStr = expDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

                const res = await sendBrevoEmail(user, TEMPLATE_DAY_23, { FECHA_FIN: expStr });
                if (res.ok) {
                    await supabase.from('user_profiles').update({ email_retencion_23_enviado: true }).eq('user_id', user.user_id);
                    results.push({ email: user.email, stage: 'Retención 23', status: 'sent' });
                }
            }
        }

        // --- 3. PROCESAR INACTIVIDAD (10 días sin mensajes) ---
        const dateInact = new Date();
        dateInact.setDate(dateInact.getDate() - 10);
        const isoInact = dateInact.toISOString();

        // IMPORTANTE: Usar .or() para incluir usuarios con last_active_at NULL
        // Para esos casos, usamos created_at como referencia
        const { data: usersInact } = await supabase
            .from('user_profiles')
            .select('user_id, email, nombre, last_active_at, created_at')
            .eq('email_inactividad_10_enviado', false)
            .or(`last_active_at.lte.${isoInact},and(last_active_at.is.null,created_at.lte.${isoInact})`);

        if (usersInact && usersInact.length > 0) {
            console.log(`[Job] Enviando Inactividad 10 a ${usersInact.length} usuarios...`);
            for (const user of usersInact) {
                const res = await sendBrevoEmail(user, TEMPLATE_INACTIVITY_10);
                if (res.ok) {
                    await supabase.from('user_profiles').update({ email_inactividad_10_enviado: true }).eq('user_id', user.user_id);
                    results.push({ email: user.email, stage: 'Inactividad 10', status: 'sent' });
                }
            }
        }


        // --- 4. PROCESAR POST-VIAJE (5 días después de terminar M5) ---
        const datePost = new Date();
        datePost.setDate(datePost.getDate() - 5);
        const isoPost = datePost.toISOString();

        const { data: usersPost } = await supabase
            .from('user_profiles')
            .select('user_id, email, nombre, journey_completed_at')
            .eq('email_post_viaje_enviado', false)
            .lte('journey_completed_at', isoPost);

        if (usersPost && usersPost.length > 0) {
            console.log(`[Job] Enviando Post-Viaje 5 a ${usersPost.length} usuarios...`);
            for (const user of usersPost) {
                const res = await sendBrevoEmail(user, TEMPLATE_POST_JOURNEY_5);
                if (res.ok) {
                    await supabase.from('user_profiles').update({ email_post_viaje_enviado: true }).eq('user_id', user.user_id);
                    results.push({ email: user.email, stage: 'Post-Viaje 5', status: 'sent' });
                }
            }
        }

        return new Response(JSON.stringify({ results }), { status: 200 });

    } catch (error) {
        console.error("[Error Crítico Job]:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
})

async function sendBrevoEmail(user, templateId, extraParams = {}) {
    const userName = user.nombre || user.email.split('@')[0];
    return fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
            'api-key': BREVO_API_KEY || '',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            to: [{ email: user.email, name: userName }],
            templateId: templateId,
            params: {
                NOMBRE: userName,
                ...extraParams
            }
        })
    });
}
