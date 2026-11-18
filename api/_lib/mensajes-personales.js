const { createClient } = require('@supabase/supabase-js');
const { applyCors, handlePreflight, rateLimit } = require('./http');
const { requireUser } = require('./auth');

async function handler(req, res) {
    applyCors(req, res);
    if (handlePreflight(req, res)) return;

    if (!rateLimit(req, res, { key: 'mensajes-personales', limit: 60, windowMs: 60000 })) return;

    const user = await requireUser(req, res);
    if (!user) return;

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Configuración de Supabase incompleta' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // --- GET: listar mensajes (solo no borrados) ---
        if (req.method === 'GET') {
            const { data, error } = await supabase
                .from('mensajes_personales')
                .select('id, asunto, contenido, leido, borrado, creado_en, remitente_id')
                .eq('destinatario_id', user.id)
                .eq('borrado', false)
                .order('creado_en', { ascending: false });

            if (error) throw error;

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

            // Marcar como leídos todos los mensajes del usuario que aún no lo estén
            if (data && data.length) {
                const idsNoLeidos = data
                    .filter(m => !m.leido)
                    .map(m => m.id);
                if (idsNoLeidos.length) {
                    await supabase
                        .from('mensajes_personales')
                        .update({ leido: true })
                        .in('id', idsNoLeidos);
                }
            }

            const mensajes = (data || []).map(m => ({
                id: m.id,
                titulo: m.asunto,
                texto: m.contenido,
                fecha: m.creado_en,
                leido: true,
                tipo: 'personal',
                remitente: remitentes[m.remitente_id] || 'Mentor'
            }));

            return res.status(200).json({ ok: true, mensajes });
        }

        // --- PATCH: marcar mensaje como borrado ---
        if (req.method === 'PATCH') {
            const url = new URL(req.url, 'http://localhost');
            const queryId = url.searchParams.get('id');
            const { id, borrado } = req.body || {};
            const msgId = id || queryId;
            if (!msgId) {
                return res.status(400).json({ error: 'Falta el id del mensaje' });
            }

            // Verificar que el mensaje pertenece al usuario
            const { data: mensaje, error: fetchError } = await supabase
                .from('mensajes_personales')
                .select('id, destinatario_id')
                .eq('id', id)
                .single();

            if (fetchError || !mensaje) {
                return res.status(404).json({ error: 'Mensaje no encontrado' });
            }
            if (mensaje.destinatario_id !== user.id) {
                return res.status(403).json({ error: 'Sin permiso para borrar este mensaje' });
            }

            const { error: updateError } = await supabase
                .from('mensajes_personales')
                .update({ borrado: borrado !== false })
                .eq('id', id);

            if (updateError) throw updateError;

            return res.status(200).json({ ok: true });
        }

        return res.status(405).json({ error: 'Método no permitido' });
    } catch (err) {
        console.error('Error en mensajes-personales:', err);
        return res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
}

module.exports = { handler };
