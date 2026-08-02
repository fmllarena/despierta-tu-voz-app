const { createClient } = require('@supabase/supabase-js');

/**
 * Actualiza el contenido de un mensaje de la tabla teacher (edición de correcciones IA).
 */
module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT').setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'PATCH') return res.status(405).json({ error: "Método no permitido" });

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { userId, messageId, content } = req.body || {};

    if (!userId || !messageId) return res.status(400).json({ error: "Se requiere userId y messageId" });
    if (typeof content !== 'string') return res.status(400).json({ error: "Se requiere content" });

    try {
        const { data, error } = await supabase
            .from('teacher')
            .update({ content })
            .eq('id', messageId)
            .eq('user_id', userId)
            .select('id')
            .maybeSingle();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: "Mensaje no encontrado o sin permisos" });

        return res.status(200).json({ success: true, id: data.id });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
