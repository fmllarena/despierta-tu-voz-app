module.exports = function handler(req, res) {
    // Solo permitimos GET para esta configuración
    if (req.method !== "GET") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    // Devolvemos las llaves de Supabase (que son públicas/anon autorizadas)
    // Las guardamos en Vercel para que no estén en el código
    return res.status(200).json({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY
    });
}
