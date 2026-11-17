const { createClient } = require('@supabase/supabase-js');
const { applyCors, handlePreflight, rateLimit } = require('./http');
const { requireMentor } = require('./auth');

async function handler(req, res) {
    applyCors(req, res);
    if (handlePreflight(req, res)) return;

    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
    if (!rateLimit(req, res, { key: 'enviar-mensaje-personal', limit: 30, windowMs: 60000 })) return;

    const mentor = await requireMentor(req, res);
    if (!mentor) return;

    const { destinatario_id, asunto, contenido } = req.body || {};
    if (!destinatario_id || !asunto || !contenido) {
        return res.status(400).json({ error: 'Faltan campos: destinatario_id, asunto, contenido' });
    }

    const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ error: 'Configuración de Supabase incompleta' });
    }

    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { data: destUser, error: destError } = await supabase.auth.admin.getUserById(destinatario_id);
        if (destError || !destUser?.user) {
            return res.status(404).json({ error: 'Destinatario no encontrado' });
        }

        const { data, error } = await supabase
            .from('mensajes_personales')
            .insert({
                destinatario_id,
                remitente_id: mentor.id,
                asunto: asunto.trim(),
                contenido: contenido.trim()
            })
            .select()
            .single();

        if (error) throw error;

        console.log(`📩 Mensaje personal enviado de ${mentor.email} a ${destUser.user.email}: "${asunto}"`);

        return res.status(201).json({
            ok: true,
            mensaje: 'Mensaje enviado correctamente',
            data
        });
    } catch (err) {
        console.error('Error en enviar-mensaje-personal:', err);
        return res.status(500).json({ error: 'Error del servidor', details: err.message });
    }
}

module.exports = { handler };
