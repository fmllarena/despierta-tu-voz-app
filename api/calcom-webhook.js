const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    // SOPORTE CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const payload = req.body;
        console.log("------------------------------------------");
        console.log("[Cal.com Webhook] Petición recibida");

        if (!payload || !payload.payload) {
            console.error("[Cal.com Webhook] Payload vacío o mal formado");
            return res.status(400).json({ error: 'Payload mal formado' });
        }

        const rawEvent = (payload.triggerEvent || "").toUpperCase();
        const eventType = rawEvent.replace('.', '_');
        const booking = payload.payload;

        if (eventType !== 'BOOKING_CREATED' && eventType !== 'BOOKING_CANCELLED') {
            return res.status(200).json({ status: 'ignored', event: rawEvent });
        }

        // 1. Cálculo de Duración (Cal.com no envía 'duration' directo, hay que calcularlo)
        let durationMinutes = 0;
        if (booking.startTime && booking.endTime) {
            const start = new Date(booking.startTime);
            const end = new Date(booking.endTime);
            durationMinutes = Math.round((end - start) / 60000);
        } else if (booking.duration) {
            // Backup por si acaso en algunas versiones sí viene
            durationMinutes = Number(booking.duration);
        }

        // 2. Identificación del Usuario (Priorizar ID, luego Email)
        const bookingMetadata = booking.metadata || {};
        const userIdFromMetadata = bookingMetadata.userId || bookingMetadata.userid;
        const userEmail = (booking.attendees?.[0]?.email || "").toLowerCase().trim();

        console.log(`[Cal.com Webhook] Evento: ${eventType} | Duración: ${durationMinutes} min`);
        console.log(`[Cal.com Webhook] ID: ${userIdFromMetadata} | Email: ${userEmail}`);

        if (!userIdFromMetadata && !userEmail) {
            console.error("[Cal.com Webhook] No se encontró forma de identificar al usuario");
            return res.status(400).json({ error: 'No user identification found' });
        }

        // 3. Buscar al usuario en Supabase
        let query = supabase.from('user_profiles').select('user_id, sessions_minutes_consumed, subscription_tier');

        if (userIdFromMetadata) {
            query = query.eq('user_id', userIdFromMetadata);
        } else {
            query = query.ilike('email', userEmail);
        }

        const { data: profile, error: searchError } = await query.single();

        if (searchError || !profile) {
            console.error(`[Cal.com Webhook] Perfil no encontrado para: ${userIdFromMetadata || userEmail}`, searchError);
            return res.status(404).json({ error: 'User profile not found' });
        }

        // 4. Actualización de Cuota (Premium / Transforma)
        const eventTitle = (booking.title || "").toLowerCase();
        const isExtra = eventTitle.includes("extra");
        const userTier = (profile.subscription_tier || "").toLowerCase().trim();

        // Permitimos premium, transforma y también pro/profundiza por si acaso (ajustable)
        const isEligible = ['premium', 'transforma'].includes(userTier);

        if (isEligible && !isExtra) {
            let newTotal = Number(profile.sessions_minutes_consumed || 0);

            if (eventType === 'BOOKING_CREATED') {
                newTotal += durationMinutes;
            } else if (eventType === 'BOOKING_CANCELLED') {
                newTotal = Math.max(0, newTotal - durationMinutes);
            }

            console.log(`[Cal.com Webhook] Actualizando cuota de ${userEmail}: ${profile.sessions_minutes_consumed} -> ${newTotal}`);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    sessions_minutes_consumed: newTotal,
                    last_active_at: new Date().toISOString()
                })
                .eq('user_id', profile.user_id);

            if (updateError) {
                console.error("[Cal.com Webhook] Error al actualizar Supabase:", updateError);
                return res.status(500).json({ error: 'Database update failed' });
            }

            console.log(`[Cal.com Webhook] ÉXITO: Contador actualizado.`);
            return res.status(200).json({ success: true, user: userEmail, newTotal });
        } else {
            console.log(`[Cal.com Webhook] Ignorado por lógica: Tier=${userTier}, Extra=${isExtra}`);
            return res.status(200).json({ status: 'ignored_by_logic', tier: userTier });
        }

    } catch (error) {
        console.error("[Cal.com Webhook] ERROR CRÍTICO:", error);
        return res.status(500).json({ error: error.message });
    }
};
