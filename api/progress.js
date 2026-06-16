const { createClient } = require('@supabase/supabase-js');

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'Falta userId' });

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const [mensajesRes, coachingRes, perfilRes] = await Promise.all([
            supabase.from('mensajes').select('created_at, emisor').eq('alumno', userId).order('created_at', { ascending: true }),
            supabase.from('user_coaching_data').select('*').eq('user_id', userId).single(),
            supabase.from('user_profiles').select('*').eq('user_id', userId).single()
        ]);

        const mensajes = mensajesRes.data || [];
        const coaching = coachingRes.data || {};
        const perfil = perfilRes.data || {};

        const totalMessages = mensajes.filter(m => m.emisor === 'usuario').length;
        const totalIA = mensajes.filter(m => m.emisor === 'ia').length;

        const messagesByMonth = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            messagesByMonth[key] = { mes: key, usuario: 0, ia: 0 };
        }
        const monthKeys = Object.keys(messagesByMonth);
        const oldestKey = monthKeys[0];
        for (const m of mensajes) {
            const d = new Date(m.created_at);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (key < oldestKey) continue;
            if (!messagesByMonth[key]) {
                messagesByMonth[key] = { mes: key, usuario: 0, ia: 0 };
            }
            messagesByMonth[key][m.emisor === 'usuario' ? 'usuario' : 'ia']++;
        }

        const accountAgeDays = Math.floor(
            (Date.now() - new Date(perfil.created_at || now).getTime()) / (1000 * 60 * 60 * 24)
        );

        const lastActive = perfil.last_active_at ? new Date(perfil.last_active_at) : null;
        const daysSinceActive = lastActive
            ? Math.floor((now - lastActive) / (1000 * 60 * 60 * 24))
            : null;

        const modulesMap = {};
        if (coaching) {
            const moduleFields = [
                'linea_vida_hitos', 'herencia_raices', 'roles_familiares',
                'personaje', 'inventario_creencias', 'carta_yo_pasado',
                'carta_padres', 'ritual_sanacion', 'sanacion_heridas',
                'proposito_vida', 'plan_accion'
            ];
            for (const field of moduleFields) {
                const val = coaching[field];
                if (val && Array.isArray(val) && val.length > 0) {
                    modulesMap[field] = val.length;
                }
            }
        }

        const moduleNames = [
            { id: 1, name: 'El Espejo del Pasado', field: 'linea_vida_hitos' },
            { id: 2, name: 'Herencia y Raíces', field: 'herencia_raices' },
            { id: 3, name: 'El Personaje', field: 'personaje' },
            { id: 4, name: 'El Altar de las Palabras', field: 'ritual_sanacion' },
            { id: 5, name: 'Alquimia Final y Propósito', field: 'proposito_vida' }
        ];

        const modulesCompleted = moduleNames.map(mod => ({
            ...mod,
            completed: perfil.last_hito_completed >= mod.id
        }));

        const hitoProgress = perfil.last_hito_completed || 0;

        const tiers = { free: 'Gratuito', pro: 'Profundiza', premium: 'Transforma' };
        const monthlyMinutes = { free: 0, pro: 0, premium: 60 };
        const tier = perfil.subscription_tier || 'free';

        return res.status(200).json({
            perfil: {
                nombre: perfil.nombre || '',
                tier,
                tierLabel: tiers[tier] || tier,
                created_at: perfil.created_at
            },
            mensajes: {
                total: totalMessages + totalIA,
                usuario: totalMessages,
                ia: totalIA,
                porMes: Object.values(messagesByMonth).sort((a, b) => a.mes.localeCompare(b.mes))
            },
            viaje: {
                hitoProgress,
                modulesCompleted,
                totalModules: moduleNames.length,
                journeyCompleted: !!perfil.journey_completed_at,
                journeyCompletedAt: perfil.journey_completed_at
            },
            sesiones: {
                minutesConsumed: perfil.sessions_minutes_consumed || 0,
                minutesAvailable: monthlyMinutes[tier] || 0,
                tier
            },
            racha: {
                daysSinceActive,
                accountAgeDays,
                lastActiveAt: perfil.last_active_at
            },
            coachingFields: Object.keys(modulesMap).length
        });
    } catch (error) {
        console.error('Error en progress.js:', error);
        return res.status(500).json({ error: error.message });
    }
};
