/**
 * api/score.js
 * Endpoint de análisis de partituras musicales con Qwen Vision (qwen-vl-max)
 * con fallback a Gemini 3.5 Flash y Claude 3.5 Sonnet.
 *
 * Flujo:
 *   1. El cliente renderiza el PDF con PDF.js (navegador) → páginas como PNG base64
 *   2. Envía { pages: [{mimeType, data}], question, context } a este endpoint
 *   3. El backend envía las imágenes a la cadena de IAs (Qwen -> Gemini -> Claude) para análisis musical
 *   4. Retorna el análisis en texto o streaming SSE
 */

const QWEN_VL_MODEL = "qwen3-vl-plus";
const QWEN_BASE_URL = process.env.QWEN_BASE_URL
    || "https://ws-vc3dtuyb2mo8tyf8.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1";

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

    if (!process.env.QWEN_API_KEY && !process.env.GEMINI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
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

        // Intento 1: Qwen (qwen-vl-max)
        if (process.env.QWEN_API_KEY) {
            try {
                console.log(`🚀 [Score API] Intentando con Qwen (${pages.length} págs)...`);
                const resultText = await callQwenScore({ pages, userText, stream, res });
                if (!stream) {
                    return res.status(200).json({ text: resultText, pages: pages.length, model: QWEN_VL_MODEL });
                }
                return;
            } catch (e) {
                console.warn("⚠️ Qwen falló en score:", e.message);
                errors.push(`Qwen: ${e.message}`);
                if (stream && res && res.writableEnded) return;
            }
        }

        // Intento 2: Gemini (gemini-3.5-flash)
        if (process.env.GEMINI_API_KEY) {
            try {
                console.log(`🚀 [Score API] Backup con Gemini (${pages.length} págs)...`);
                const resultText = await callGeminiScore({ pages, userText, stream, res });
                if (!stream) {
                    return res.status(200).json({ text: resultText, pages: pages.length, model: "gemini-3.5-flash" });
                }
                return;
            } catch (e) {
                console.warn("⚠️ Gemini falló en score:", e.message);
                errors.push(`Gemini: ${e.message}`);
                if (stream && res && res.writableEnded) return;
            }
        }

        // Intento 3: Claude (claude-3-5-sonnet-latest)
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
 * Llama a Qwen Vision API
 */
async function callQwenScore({ pages, userText, stream, res }) {
    const userContent = [
        ...pages.map(page => ({
            type: "image_url",
            image_url: {
                url: `data:${page.mimeType};base64,${page.data}`,
                detail: "high"
            }
        })),
        { type: "text", text: userText }
    ];

    const requestBody = {
        model: QWEN_VL_MODEL,
        messages: [
            { role: "system", content: SCORE_SYSTEM_PROMPT },
            { role: "user", content: userContent }
        ],
        temperature: 0.5,
        max_tokens: MAX_TOKENS,
        stream: !!stream
    };

    const response = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Qwen Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
    }

    if (stream && res) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
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
 * Llama a Gemini API
 */
async function callGeminiScore({ pages, userText, stream, res }) {
    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:${endpoint}?key=${process.env.GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`;

    const parts = [
        ...pages.map(page => ({
            inlineData: {
                mimeType: page.mimeType,
                data: page.data
            }
        })),
        { text: userText }
    ];

    const requestBody = {
        contents: [{ role: "user", parts }],
        systemInstruction: { parts: [{ text: SCORE_SYSTEM_PROMPT }] }
    };

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(`Gemini Error ${response.status}: ${errData.error?.message || 'Unknown'}`);
    }

    if (stream && res) {
        if (!res.headersSent) {
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
        }
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
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
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
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

