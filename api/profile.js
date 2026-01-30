const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT').setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Falta userId' });

        // 1. Intentar obtener el perfil
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

        if (profile) {
            return res.status(200).json(profile);
        }

        // 2. Si no existe, intentar recuperarlo de Auth y crearlo
        console.log(`🛠️ Perfil no hallado para ${userId}. Intentando creación proactiva...`);
        const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
        const authUser = authData?.user;

        if (!authUser || authError) {
            return res.status(404).json({ error: 'Usuario no encontrado en Auth' });
        }

        const nombre = authUser.user_metadata?.nombre || authUser.email.split('@')[0];

        // --- LÓGICA DE DISTINCIÓN ---
        // 1. Buscamos si tiene hitos reales en coaching_data (Veterano activo)
        const { data: coachingData } = await supabase
            .from('user_coaching_data')
            .select('linea_vida_hitos, herencia_raices, roles_familiares, ritual_sanacion, plan_accion')
            .eq('user_id', userId)
            .maybeSingle();

        let tier = 'pro';
        let trialEnd = null;

        // Verificamos si alguno de los campos jsonb tiene contenido (no es null ni array vacío)
        const hasContent = coachingData && Object.values(coachingData).some(val => Array.isArray(val) && val.length > 0);

        if (hasContent) {
            // Es veterano activo: Acceso PRO permanente (Betatester)
            tier = 'pro';
            trialEnd = null;
            console.log(`✨ Usuario veterano ACTIVO detectado (${authUser.email}). Asignando PRO permanente.`);
        } else {
            // Es usuario nuevo o inactivo: Plan FREE por defecto
            tier = 'free';
            trialEnd = null;
            console.log(`🌱 Usuario nuevo detectado (${authUser.email}). Asignando plan FREE.`);
        }

        const { data: newProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert({
                user_id: userId,
                email: authUser.email,
                nombre: nombre,
                subscription_tier: tier,
                trial_end_date: trialEnd,
                created_at: authUser.created_at || new Date().toISOString()
            })
            .select('*')
            .single();

        if (createError) {
            console.error("❌ Error creando perfil:", createError);
            throw createError;
        }

        console.log("✅ Perfil creado proactivamente para:", authUser.email);
        return res.status(200).json(newProfile);

    } catch (err) {
        console.error('Error en api/profile:', err);
        return res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
};
