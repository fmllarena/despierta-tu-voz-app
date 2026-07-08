/**
 * api/score.js
 * Endpoint de análisis de partituras musicales.
 * Temporalmente solo Mistral (imágenes/partituras).
 */

// Límites de seguridad
const MAX_PAGES = 6;          // Máximo de páginas por solicitud
const MAX_PAGE_SIZE_MB = 4;   // Tamaño máximo por página en MB
const MAX_TOKENS = 2500;

const SCORE_SYSTEM_PROMPT = `Eres un experto músico y pedagogo especializado en análisis de partituras vocales.
Cuando el alumno te muestre una partitura, debes:
- Identificar la clave, tonalidad, compás y tempo
- Describir el fraseo, los saltos interválicos y el rango vocal
- Señalar los desafíos técnicos para la voz (agudos, legato, ornamentos)
- Dar consejos prácticos para estudiar esa partitura paso a paso
- Usar terminología musical precisa pero explicada con claridad
- Responder siempre en el idioma del alumno (normalmente español)
Si el alumno hace preguntas específicas sobre pasajes concretos, enfócate en esas secciones.`;

module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

    if (!process.env.MISTRAL_API_KEY && !process.env.ANTHROPIC_API_KEY) {
        return res.status(500).json({ error: 'Ninguna API Key de IA configurada' });
    }

    try {
        const { pages = [], question = '', stream = false, context = '' } = req.body;

        // Validaciones
        if (!pages || pages.length === 0) {
            return res.status(400).json({ error: 'Se requiere al menos una página de la partitura' });
        }
        if (pages.length > MAX_PAGES) {
            return res.status(400).json({ error: `Máximo ${MAX_PAGES} páginas por solicitud` });
        }

        // Validar tamaño de cada página
        for (const [i, page] of pages.entries()) {
            if (!page.mimeType || !page.data) {
                return res.status(400).json({ error: `Página ${i + 1}: formato incorrecto (falta mimeType o data)` });
            }
            const sizeMB = (page.data.length * 3) / 4 / 1024 / 1024; // aprox. bytes de base64
            if (sizeMB > MAX_PAGE_SIZE_MB) {
                return res.status(400).json({ error: `Página ${i + 1} demasiado grande (${sizeMB.toFixed(1)}MB, máx ${MAX_PAGE_SIZE_MB}MB)` });
            }
        }

        // Construir prompt
        const userText = buildScorePrompt(question, pages.length, context);
        const errors = [];

        // Intento 1: Mistral
        if (process.env.MISTRAL_API_KEY) {
            try {
                console.log(`🚀 [Score API] Mistral (${pages.length} págs)...`);
                const resultText = await callMistralScore({ pages, userText, stream, res });
                if (!stream) {
                    return res.status(200).json({ text: resultText, pages: pages.length, model: "mistral-small-latest" });
                }
                return;
            } catch (e) {
                console.warn("⚠️ Mistral falló en score:", e.message);
                errors.push(`Mistral: ${e.message}`);
                if (stream && res && res.writableEnded) return;
            }
        }

        // Intento 2: Claude
        if (process.env.ANTHROPIC_API_KEY) {
            try {
                console.log(`🚀 [Score API] Backup con Claude (${pages.length} págs)...`);
                const resultText = await callClaudeScore({ pages, userText, stream, res });
                if (!stream) {
                    return res.status(200).json({ text: resultText, pages: pages.length, model: "claude-sonnet-4-6" });
                }
                return;
            } catch (e) {
                console.warn("⚠️ Claude falló en score:", e.message);
                errors.push(`Claude: ${e.message}`);
                if (stream && res && res.writableEnded) return;
            }
        }

        throw new Error(`Todos los modelos fallaron al analizar la partitura: ${errors.join(" | ")}`);

    } catch (error) {
        console.error('⛔ [Score API Error]:', error);
        const msg = error.message || 'Error al analizar la partitura';
        if (!res.writableEnded) {
            return res.status(500).json({ error: msg });
        }
    }
};

/**
 * Llama a Gemini API
 */
async function callMistralScore({ pages, userText, stream, res }) {
    const content = [
        ...pages.map(p => ({ type: 'image_url', image_url: `data:${p.mimeType};base64,${p.data}` })),
        { type: 'text', text: userText }
    ];

    const messages = [
        { role: 'system', content: SCORE_SYSTEM_PROMPT },
        { role: 'user', content }
    ];

    const requestBody = {
        model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
        messages,
        temperature: 0.7,
        max_tokens: 2500,
        stream: !!stream
    };

    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Mistral Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
    }

    if (stream && res) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop();
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const text = data.choices?.[0]?.delta?.content;
                            if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        } catch (e) { /* chunk incompleto */ }
                    }
                }
            }
        } finally {
            res.end();
        }
    } else {
        const data = await response.json();
        return data.choices?.[0]?.message?.content || "";
    }
}

/**
 * Llama a Claude API
 */
async function callClaudeScore({ pages, userText, stream, res }) {
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const content = [
        ...pages.map(page => ({
            type: "image",
            source: {
                type: "base64",
                media_type: page.mimeType,
                data: page.data
            }
        })),
        { type: "text", text: userText }
    ];

    if (stream && res) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
        const streamResponse = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: MAX_TOKENS,
            system: SCORE_SYSTEM_PROMPT,
            messages: [{ role: "user", content }],
            stream: true
        });

        for await (const chunk of streamResponse) {
            if (chunk.type === 'content_block_delta' && chunk.delta?.text) {
                res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`);
            }
        }
        res.end();
    } else {
        const response = await anthropic.messages.create({
            model: "claude-sonnet-4-6",
            max_tokens: MAX_TOKENS,
            system: SCORE_SYSTEM_PROMPT,
            messages: [{ role: "user", content }]
        });
        return response.content[0].text;
    }
}

/**
 * Construye el prompt de análisis según el contexto
 */
function buildScorePrompt(question, numPages, context) {
    let prompt = numPages === 1
        ? `Analiza esta partitura musical.`
        : `Analiza estas ${numPages} páginas de partitura musical.`;

    if (context) {
        prompt += `\n\nContexto del alumno: ${context}`;
    }

    if (question && question.trim()) {
        prompt += `\n\nPregunta específica: ${question}`;
    } else {
        prompt += `\n\nHaz un análisis completo: tonalidad, compás, estructura, desafíos vocales y consejos de estudio.`;
    }

    return prompt;
}

