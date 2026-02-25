module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text, languageCode = 'es-ES', voiceName } = req.body;
    // Intentamos usar la clave específica de TTS, si no, usamos la de Gemini como fallback
    const apiKey = process.env.GOOGLE_TTS_API_KEY || process.env.GEMINI_API_KEY;

    // Mapa de voces por defecto con su género correcto para evitar errores 400
    const voiceMaps = {
        'en-US': { name: 'en-US-Studio-O', gender: 'FEMALE' },
        'de-DE': { name: 'de-DE-Studio-B', gender: 'MALE' },
        'it-IT': { name: 'it-IT-Studio-C', gender: 'MALE' },
        'fr-FR': { name: 'fr-FR-Studio-A', gender: 'FEMALE' },
        'pt-PT': { name: 'pt-PT-Wavenet-D', gender: 'FEMALE' },
        'es-ES': { name: 'es-ES-Chirp3-HD-Aoede', gender: 'FEMALE' }
    };

    const config = voiceMaps[languageCode] || voiceMaps['en-US'];
    const finalVoiceName = voiceName || config.name;
    const finalGender = (voiceMaps[languageCode] && !voiceName) ? config.gender : 'FEMALE';

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
                        languageCode: languageCode,
                        name: finalVoiceName,
                        ssmlGender: finalGender
                    },
                    audioConfig: { audioEncoding: 'MP3' }
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Error G-TTS Detail:", JSON.stringify(data, null, 2));
            let errorMsg = data.error?.message || 'Error en Google TTS';

            // Añadimos más contexto al error para el usuario
            const diagnostic = `(Status: ${response.status}, Reason: ${data.error?.status || 'Unknown'})`;

            if (response.status === 403) {
                errorMsg = `Permiso Denegado por Google: ${errorMsg}. ${diagnostic}. Revisa si la Cloud Text-to-Speech API tiene la facturación (Billing) activa y si el modelo Aoede está habilitado para tu región.`;
            } else {
                errorMsg = `${errorMsg} ${diagnostic}`;
            }

            return res.status(response.status).json({ error: errorMsg });
        }

        // Devolvemos el base64 del audio
        res.status(200).json({ audioContent: data.audioContent });

    } catch (error) {
        console.error("Error en /api/tts:", error);
        res.status(500).json({ error: 'Error interno al generar la voz.' });
    }
}
