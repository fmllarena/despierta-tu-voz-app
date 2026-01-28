const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'M??todo no permitido' });

    // 1. Comprobar Variables de Entorno
    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({
            error: 'Configuraci??n incompleta',
            details: 'Faltan claves de Supabase en Vercel.'
        });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { code, userId } = req.body;
        console.log(`???? Intento de canje: Code="${code}", UserId="${userId}"`);

        if (!code || !userId) {
            return res.status(400).json({ error: 'Faltan datos (code, userId)' });
        }

        const normalizedCode = code.trim().toUpperCase();
        const VALID_CODES = ['PROMO1MES', 'ALQUIMIA2026', 'PROMO2026', 'FERNANDO2026'];

        if (!VALID_CODES.includes(normalizedCode)) {
            return res.status(400).json({ error: `El c??digo "${normalizedCode}" no es v??lido.` });
        }

        // 2. Verificar si el usuario existe y su nivel actual (con reintentos)
        let profile = null;
        let attempts = 0;
        const maxAttempts = 5;
        const delayMs = 800;

        while (!profile && attempts < maxAttempts) {
            attempts++;
            console.log(`???? Intento ${attempts}/${maxAttempts} de buscar perfil para userId: ${userId}`);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('subscription_tier')
                .eq('user_id', userId)
                .single();

            if (!error && data) {
                profile = data;
                console.log(`??? Perfil encontrado en intento ${attempts}`);
            } else if (attempts < maxAttempts) {
                console.log(`??? Perfil no encontrado, esperando ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        if (!profile) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                details: 'El perfil a??n no est?? disponible. Por favor, espera unos segundos e intenta de nuevo.'
            });
        }

        if (profile.subscription_tier === 'pro' || profile.subscription_tier === 'premium') {
            return res.status(200).json({
                success: true,
                message: 'Ya tienes un plan activo. ??No necesitas redimir el c??digo!'
            });
        }

        // 3. Proceder al alta Pro
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: 'pro',
                updated_at: new Date().toISOString(),
                mentor_notes: `Promo ${normalizedCode} canjeada`
            })
            .eq('user_id', userId);

        if (updateError) throw updateError;

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Error cr??tico:', err);
        return res.status(500).json({
            error: 'Database Error',
            details: err.message
        });
    }
}
