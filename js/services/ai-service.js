/**
 * Llama a la API de AI (Gemini) a través del backend.
 * @param {string} message - El mensaje del usuario.
 * @param {Array} history - El historial de conversación.
 * @param {string} intent - El propósito de la llamada (mentor_chat, etc).
 * @param {Object} extraData - Datos adicionales (userId, etc).
 * @param {Function} onChunk - Callback para streaming.
 */
export async function llamarGemini(message, history, intent, extraData = {}, onChunk = null) {
    try {
        const stream = !!onChunk;
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history, intent, stream, ...extraData })
        });

        if (stream) {
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let fullText = "";

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            if (data.error) throw new Error(data.error);
                            if (data.text) {
                                fullText += data.text;
                                if (onChunk) onChunk(data.text, fullText);
                            }
                        } catch (e) {
                            console.error("Error parseando stream chunk:", e);
                        }
                    }
                }
            }
            return fullText;
        } else {
            const data = await response.json();
            if (data.error) throw new Error(data.error);
            return data.text || "";
        }
    } catch (e) {
        console.error("❌ [AI Service] Fallo llamarGemini:", e);
        throw e;
    }
}
