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

    const { destinatario_id, asunto, contenido, archivo_nombre, archivo_tipo, archivo_datos } = req.body || {};
    if (!destinatario_id || !asunto || !contenido) {
        return res.status(400).json({ error: 'Faltan campos: destinatario_id, asunto, contenido' });
    }

    // Validar archivo si se envía
    let archivoDatosValidados = null;
    if (archivo_datos) {
        if (!archivo_nombre || !archivo_tipo) {
            return res.status(400).json({ error: 'Faltan metadatos del archivo (nombre o tipo)' });
        }
        // Solo permitir imágenes y PDFs
        const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
        if (!tiposPermitidos.includes(archivo_tipo)) {
            return res.status(400).json({ error: 'Tipo de archivo no permitido. Solo imágenes (jpg, png, webp) y PDF.' });
        }
        archivoDatosValidados = archivo_datos;
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
                contenido: contenido.trim(),
                archivo_nombre: archivo_nombre || null,
                archivo_tipo: archivo_tipo || null,
                archivo_datos: archivoDatosValidados
            })
            .select()
            .single();

        if (error) throw error;

        console.log(`📩 Mensaje personal enviado de ${mentor.email} a ${destUser.user.email}: "${asunto}"${archivo_nombre ? ` [archivo: ${archivo_nombre}]` : ''}`);

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
