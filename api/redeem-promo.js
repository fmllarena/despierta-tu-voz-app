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
        const maxAttempts = 10;
        const delayMs = 800;

        while (!profile && attempts < maxAttempts) {
            attempts++;
            console.log(`🔄 Intento ${attempts}/${maxAttempts} de buscar perfil para userId: ${userId}`);

            const { data, error } = await supabase
                .from('user_profiles')
                .select('subscription_tier, promo_locked_price')
                .eq('user_id', userId)
                .single();

            if (!error && data) {
                profile = data;
                console.log(`✅ Perfil encontrado en intento ${attempts}`);
            } else if (attempts < maxAttempts) {
                console.log(`⏳ Perfil no encontrado (Intento ${attempts}), esperando ${delayMs}ms...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }

        // --- REPARACIÓN PROACTIVA ---
        if (!profile) {
            console.log("⚠️ Perfil no encontrado tras reintentos. Verificando en Auth Admin...");
            const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
            const authUser = authData?.user;

            if (authUser && !authError) {
                console.log(`🛠️ Usuario hallado en Auth (${authUser.email}). Creando perfil manualmente...`);
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                        user_id: userId,
                        email: authUser.email,
                        nombre: authUser.user_metadata?.nombre || authUser.email.split('@')[0],
                        subscription_tier: 'pro',
                        accepted_terms: true,
                        trial_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                    })
                    .select('subscription_tier, promo_locked_price')
                    .single();

                if (!createError && newProfile) {
                    profile = newProfile;
                    console.log("✅ Perfil reparado y creado con éxito.");
                } else {
                    console.error("❌ Error reparando perfil:", createError);
                }
            } else {
                console.error("❌ Usuario no encontrado en Auth Admin:", authError);
            }
        }

        if (!profile) {
            return res.status(404).json({
                error: 'Usuario no encontrado',
                details: 'El perfil no se pudo encontrar ni crear. Por favor, asegúrate de haber confirmado tu email o intenta entrar de nuevo.'
            });
        }

        // 3. Registrar la promo (incluso si ya es Pro, para marcar el precio blindado)
        const promoNote = `Promo ${normalizedCode} canjeada - Precio blindado 9,90€/mes`;

        // Verificar si ya tiene esta promo registrada
        if (profile.promo_locked_price === 9.90) {
            console.log(`ℹ️ Usuario ${userId} ya tiene el precio blindado activo.`);
            return res.status(200).json({
                success: true,
                message: '¡Esta promoción ya está activa en tu cuenta! Disfrutas del precio blindado de 9,90€/mes.'
            });
        }

        // Extender el trial 30 días más desde ahora
        const newTrialEnd = new Date();
        newTrialEnd.setDate(newTrialEnd.getDate() + 30);

        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: 'pro',
                promo_locked_price: 9.90,
                trial_end_date: newTrialEnd.toISOString(),
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
        console.error('Error crítico en redeem-promo:', err);
        return res.status(500).json({
            error: 'Database Error',
            details: err.message
        });
    }
}