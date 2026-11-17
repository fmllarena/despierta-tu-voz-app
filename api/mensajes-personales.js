const { createClient } = require('@supabase/supabase-js');
const { applyCors, handlePreflight, rateLimit } = require('./_lib/http');
const { requireUser } = require('./_lib/auth');

module.exports = async function handler(req, res) {
    applyCors(req, res);
    if (handlePreflight(req, res)) return;

    if (req.method !== 'GET') return res.status(405).json({ error: 'Método no permitido' });
    if (!rateLimit(req, res, { key: 'mensajes-personales', limit: 60, windowMs: 60000 })) return;

    const user = await requireUser(req, res);
    if (!user) return;

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Configuración de Supabase incompleta' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data, error } = await supabase
            .from('mensajes_personales')
            .select('id, asunto, contenido, leido, creado_en, remitente_id')
            .eq('destinatario_id', user.id)
            .order('creado_en', { ascending: false });

        if (error) throw error;

        // Obtener nombres de los remitentes para mostrar
        const remitentes = {};
        if (data && data.length) {
            const remitenteIds = [...new Set(data.map(m => m.remitente_id))];
            const { data: perfiles } = await supabase
                .from('user_profiles')
                .select('user_id, nombre, email')
                .in('user_id', remitenteIds);
            if (perfiles) {
                perfiles.forEach(p => {
                    remitentes[p.user_id] = p.nombre || p.email;
                });
            }
        }

        const mensajes = (data || []).map(m => ({
            id: m.id,
            titulo: m.asunto,
            texto: m.contenido,
            fecha: m.creado_en,
            leido: m.leido,
            tipo: 'personal',
            remitente: remitentes[m.remitente_id] || 'Mentor'
        }));

        return res.status(200).json({ ok: true, mensajes });
    } catch (err) {
        console.error('Error en api/mensajes-personales:', err);
        return res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
};
