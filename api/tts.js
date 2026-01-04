export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, voiceName = 'es-ES-Chirp3-HD-Aoede' } = req.body;
    const apiKey = process.env.GOOGLE_TTS_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'Falta la API Key de Google TTS en el servidor.' });
    }

    if (!text) {
        return res.status(400).json({ error: 'No se proporcionó texto para sintetizar.' });
    }

    try {
        const response = await fetch(
            `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: {
                        languageCode: 'es-ES',
                        name: voiceName,
                        ssmlGender: 'NEUTRAL' // Generalmente Studio-B es neutral o masculino
                    },
                    audioConfig: { audioEncoding: 'MP3' }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Error G-TTS:", data);
            return res.status(response.status).json({ error: data.error?.message || 'Error en Google TTS' });
        }

        // Devolvemos el base64 del audio
        res.status(200).json({ audioContent: data.audioContent });

    } catch (error) {
        console.error("Error en /api/tts:", error);
        res.status(500).json({ error: 'Error interno al generar la voz.' });
    }
}
