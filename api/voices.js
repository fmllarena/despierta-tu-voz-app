export default async function handler(req, res) {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta la API Key de Google TTS.' });
    }

    try {
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`,
            { method: 'GET' }
        );

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Error al listar voces' });
        }

        // Filtramos solo voces en español (de cualquier región)
        const voices = data.voices
            .filter(v => v.languageCodes.some(lc => lc.startsWith('es')))
            .map(v => ({
                name: v.name,
                ssmlGender: v.ssmlGender,
                type: v.name.includes('Studio') ? 'Studio' :
                    v.name.includes('Neural') ? 'Neural' :
                        v.name.includes('Polyglot') ? 'Polyglot' : 'Standard'
            }))
            // Ordenamos para que las voces Studio y Neural aparezcan primero
            .sort((a, b) => {
                const priority = { 'Studio': 1, 'Neural': 2, 'Polyglot': 3, 'Standard': 4 };
                return (priority[a.type] || 5) - (priority[b.type] || 5);
            });

        res.status(200).json({ voices });

    } catch (error) {
        console.error("Error en /api/voices:", error);
        res.status(500).json({ error: 'Error interno al consultar las voces.' });
    }
}
