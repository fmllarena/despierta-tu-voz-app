const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Utilidad para leer el body en bruto (RAW) necesario para verificar la firma
async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

const handler = async function (req, res) {
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
    const CALCOM_SECRET = "dtv_vocal_mentor_secure_pAss";
    const signature = req.headers['x-cal-signature-256'];

    let rawBody;
    try {
        rawBody = await buffer(req);
        const bodyString = rawBody.toString();

        if (signature) {
            const hmac = crypto.createHmac('sha256', CALCOM_SECRET);
            const digest = hmac.update(bodyString).digest('hex');

            if (signature !== digest) {
                console.error("[SEGURIDAD] Firma de Cal.com inválida.");
                return res.status(401).json({ error: 'Invalid signature' });
            }
        }

        const payload = JSON.parse(bodyString);
        console.log("[Cal.com Proxy] Payload verificado:", JSON.stringify(payload));

        const rawEvent = (payload.triggerEvent || "").toUpperCase();
        const eventType = rawEvent.replace('.', '_');
        const booking = payload.payload;

        if (eventType !== 'BOOKING_CREATED' && eventType !== 'BOOKING_CANCELLED') {
            return res.status(200).json({ status: 'ignored', event: rawEvent });
        }

        const userEmail = (booking.attendees?.[0]?.email || "").toLowerCase().trim();
        const durationMinutes = Number(booking.duration) || 0;

        if (!userEmail) {
            console.error("No se encontró email en el payload de Cal.com");
            return res.status(400).json({ error: 'No email found' });
        }

        const { data: profile, error: searchError } = await supabase
            .from('user_profiles')
            .select('user_id, sessions_minutes_consumed, subscription_tier')
            .ilike('email', userEmail)
            .single();

        if (searchError || !profile) {
            console.error(`Usuario no encontrado: ${userEmail}`, searchError);
            return res.status(404).json({ error: 'User not found in Supabase' });
        }

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

            return res.status(200).json({ success: true, newTotal });
        } else {
            return res.status(200).json({ status: 'ignored_logic', reason: 'Not eligible tier or extra session' });
        }

    } catch (error) {
        console.error("[ERROR CRITICO Proxy Cal.com]:", error.message);
        return res.status(500).json({ error: error.message });
    }
};

// IMPORTANTE: Desactivar bodyParser para poder leer el RAW body
handler.config = {
    api: {
        bodyParser: false,
    },
};

module.exports = handler;
