const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    // 1. Comprobar Variables de Entorno
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
            error: 'Configuración incompleta',
            details: 'Faltan claves de Supabase en Vercel.'
        });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { code, userId } = req.body;
        console.log(`🔍 Intento de canje: Code="${code}", UserId="${userId}"`);

        if (!code || !userId) {
            return res.status(400).json({ error: 'Faltan datos (code, userId)' });
        }

        const normalizedCode = code.trim().toUpperCase();
        const VALID_CODES = ['PROMO1MES', 'ALQUIMIA2026', 'PROMO2026', 'FERNANDO2026'];

        if (!VALID_CODES.includes(normalizedCode)) {
            return res.status(400).json({ error: `El código "${normalizedCode}" no es válido.` });
        }

        // 2. Verificar si el usuario existe y su nivel actual (con reintentos)
        let profile = null;
        let attempts = 0;
        const maxAttempts = 5;
        const delayMs = 800;

        while (!profile && attempts < maxAttempts) {
            attempts++;
            console.log(`🔄 Intento ${attempts}/${maxAttempts} de buscar perfil para userId: ${userId}`);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('subscription_tier')
                .eq('user_id', userId)
                .single();

            if (!error && data) {
                profile = data;
                console.log(`✅ Perfil encontrado en intento ${attempts}`);
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Perfil no encontrado, esperando ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        if (!profile) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                details: 'El perfil aún no está disponible. Por favor, espera unos segundos e intenta de nuevo.'
            });
        }

        // 3. Registrar la promo (incluso si ya es Pro, para marcar el precio blindado)
        const promoNote = `Promo ${normalizedCode} canjeada - Precio blindado 9,90€/mes`;

        // Verificar si ya tiene esta promo registrada
        if (profile.promo_locked_price === 9.90) {
            return res.status(200).json({
                success: true,
                message: '¡Esta promoción ya está activa en tu cuenta! Disfrutas del precio blindado de 9,90€/mes.'
            });
        }

        // Extender el trial 30 días más desde ahora (para dar tiempo a configurar pago)
        const newTrialEnd = new Date();
        newTrialEnd.setDate(newTrialEnd.getDate() + 30);

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: 'pro',  // Asegurar que sea Pro
                promo_locked_price: 9.90,  // Precio blindado
                trial_end_date: newTrialEnd.toISOString(),  // Extender trial
                updated_at: new Date().toISOString(),
                mentor_notes: promoNote
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        console.log(`✅ Promo ${normalizedCode} registrada para userId: ${userId} con precio blindado 9.90€`);
        return res.status(200).json({
            success: true,
            message: '¡Promoción activada! Tienes acceso Pro con precio blindado de 9,90€/mes para siempre.'
        });

    } catch (err) {
        console.error('Error crítico:', err);
        return res.status(500).json({
            error: 'Database Error',
            details: err.message
        });
    }
}