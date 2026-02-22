const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    // Configurar CORS
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

    // --- SEGURIDAD: VERIFICACIÓN DE SECRETO ---
    // El secreto que el usuario pone en Cal.com se usa para validar el mensaje
    const CALCOM_SECRET = "dtv_vocal_mentor_secure_pAss"; // Este es el secreto generado
    const signature = req.headers['x-cal-signature-256'];

    // Si quieres máxima seguridad, aquí se verificaría la firma HMAC. 
    // Para esta implementación rápida, verificaremos que el mensaje venga de Cal.com.
    // En Cal.com, el campo "Secreto" sirve para firmar el contenido.
    if (signature) {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', CALCOM_SECRET);
        // Usamos el body tal cual para verificar la firma
        const digest = hmac.update(JSON.stringify(req.body)).digest('hex');

        if (signature !== digest) {
            console.error("[SEGURIDAD] Firma de Cal.com inválida.");
            return res.status(401).json({ error: 'Invalid signature' });
        }
    }

    try {
        const payload = req.body;
        console.log("[Cal.com Proxy] Recibido payload:", JSON.stringify(payload));

        // Cal.com envía varios tipos de eventos. Nos interesa 'BOOKING_CREATED' y 'BOOKING_CANCELLED'
        // Aceptamos formatos con punto (booking.created) y con guion bajo (BOOKING_CREATED)
        const rawEvent = (payload.triggerEvent || "").toUpperCase();
        const eventType = rawEvent.replace('.', '_');
        const booking = payload.payload;

        if (eventType !== 'BOOKING_CREATED' && eventType !== 'BOOKING_CANCELLED') {
            return res.status(200).json({ status: 'ignored', event: rawEvent });
        }

        // 1. Obtener el email del usuario y normalizarlo
        const userEmail = (booking.attendees?.[0]?.email || "").toLowerCase().trim();
        const durationMinutes = Number(booking.duration) || 0;

        if (!userEmail) {
            console.error("No se encontró email en el payload de Cal.com");
            return res.status(400).json({ error: 'No email found' });
        }

        console.log(`[Cal.com Proxy] Procesando ${eventType} para ${userEmail} (${durationMinutes} min)`);

        // 2. Buscar al usuario en Supabase (insensible a mayúsculas/minúsculas)
        const { data: profile, error: searchError } = await supabase
            .from('user_profiles')
            .select('user_id, sessions_minutes_consumed, subscription_tier')
            .ilike('email', userEmail)
            .single();

        if (searchError || !profile) {
            console.error(`Usuario no encontrado: ${userEmail}`, searchError);
            return res.status(404).json({ error: 'User not found in Supabase' });
        }

        // 3. Solo contamos minutos si es el plan Premium/Transforma y no es una sesión "extra"
        const eventTitle = (booking.title || "").toLowerCase();
        const isExtra = eventTitle.includes("extra");
        const userTier = (profile.subscription_tier || "").toLowerCase().trim();

        const isPremiumTier = userTier === 'premium' || userTier === 'transforma';

        if (isPremiumTier && !isExtra) {
            let newTotal = Number(profile.sessions_minutes_consumed) || 0;

            if (eventType === 'BOOKING_CREATED') {
                newTotal += durationMinutes;
            } else if (eventType === 'BOOKING_CANCELLED') {
                newTotal = Math.max(0, newTotal - durationMinutes);
            }

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    sessions_minutes_consumed: newTotal,
                    last_active_at: new Date().toISOString()
                })
                .eq('user_id', profile.user_id);

            if (updateError) {
                console.error("Error actualizando cuota:", updateError);
                return res.status(500).json({ error: 'Update failed' });
            }

            console.log(`[EXITO] Cuota actualizada para ${userEmail}: ${newTotal} min.`);
            return res.status(200).json({ success: true, newTotal });
        } else {
            console.log(`[INFO] Evento ignorado. Tier: ${userTier}, Extra: ${isExtra}`);
            return res.status(200).json({ status: 'ignored_logic', reason: 'Not eligible tier or extra session' });
        }

    } catch (error) {
        console.error("[ERROR CRITICO Proxy Cal.com]:", error.message);
        return res.status(500).json({ error: error.message });
    }
};
