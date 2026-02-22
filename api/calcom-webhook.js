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
        console.log("[Cal.com Webhook] Payload:", JSON.stringify(payload));

        if (!payload || !payload.payload) {
            console.error("[Cal.com Webhook] Payload vacío o mal formado");
            return res.status(400).json({ error: 'Payload mal formado' });
        }

        const rawEvent = (payload.triggerEvent || "").toUpperCase();
        const eventType = rawEvent.replace('.', '_');
        const booking = payload.payload;

        console.log(`[Cal.com Webhook] Evento: ${eventType}`);

        if (eventType !== 'BOOKING_CREATED' && eventType !== 'BOOKING_CANCELLED') {
            console.log(`[Cal.com Webhook] Evento ignorado: ${rawEvent}`);
            return res.status(200).json({ status: 'ignored', event: rawEvent });
        }

        // 1. Obtener el email del usuario
        const userEmail = (booking.attendees?.[0]?.email || "").toLowerCase().trim();
        const durationMinutes = Number(booking.duration) || 0;

        if (!userEmail) {
            console.error("[Cal.com Webhook] No se encontró email en el payload");
            return res.status(400).json({ error: 'No email found' });
        }

        console.log(`[Cal.com Webhook] Usuario: ${userEmail}, Duración: ${durationMinutes} min`);

        // 2. Buscar al usuario en Supabase (insensible a mayúsculas/minúsculas)
        const { data: profile, error: searchError } = await supabase
            .from('user_profiles')
            .select('user_id, sessions_minutes_consumed, subscription_tier')
            .ilike('email', userEmail)
            .single();

        if (searchError || !profile) {
            console.error(`[Cal.com Webhook] Usuario no encontrado en DB: ${userEmail}`, searchError);
            return res.status(404).json({ error: 'User not found' });
        }

        // 3. Verificación de Plan
        const eventTitle = (booking.title || "").toLowerCase();
        const isExtra = eventTitle.includes("extra");
        const userTier = (profile.subscription_tier || "").toLowerCase().trim();

        console.log(`[Cal.com Webhook] Tier DB: ${userTier}, Título reserva: ${eventTitle}`);

        const isPremiumTier = userTier === 'premium' || userTier === 'transforma';

        if (isPremiumTier && !isExtra) {
            let newTotal = Number(profile.sessions_minutes_consumed) || 0;

            if (eventType === 'BOOKING_CREATED') {
                newTotal += durationMinutes;
            } else if (eventType === 'BOOKING_CANCELLED') {
                newTotal = Math.max(0, newTotal - durationMinutes);
            }

            console.log(`[Cal.com Webhook] Actualizando cuota. Anterior: ${profile.sessions_minutes_consumed}, Nueva: ${newTotal}`);

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    sessions_minutes_consumed: newTotal,
                    last_active_at: new Date().toISOString()
                })
                .eq('user_id', profile.user_id);

            if (updateError) {
                console.error("[Cal.com Webhook] Error actualizando Supabase:", updateError);
                return res.status(500).json({ error: 'Update failed' });
            }

            console.log(`[Cal.com Webhook] ÉXITO: Cuota actualizada para ${userEmail}`);
            return res.status(200).json({ success: true, newTotal });
        } else {
            console.log(`[Cal.com Webhook] Sesión ignorada por lógica comercial (Tier o Extra)`);
            return res.status(200).json({ status: 'ignored_by_tier', tier: userTier });
        }

    } catch (error) {
        console.error("[Cal.com Webhook] ERROR CRÍTICO:", error);
        return res.status(500).json({ error: error.message });
    }
};
