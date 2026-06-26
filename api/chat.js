const { createClient } = require('@supabase/supabase-js');
const { SYSTEM_PROMPTS } = require('./_lib/prompts');
const { sanitizeGeminiHistory } = require('./_lib/utils');

// --- CONFIGURACIÓN MISTRAL (primario — servidores UE, Francia) ---
const MISTRAL_MODEL = "mistral-small-latest";
const MISTRAL_BASE_URL = "https://api.mistral.ai/v1";

// --- CONFIGURACIÓN GEMINI ---
const GEMINI_MODEL = "gemini-3.5-flash";
const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Orquestador principal de la API de Chat
 */
module.exports = async function handler(req, res) {
    // SOPORTE CORS
    res.setHeader('Access-Control-Allow-Credentials', true).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT').setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const { stream } = req.body;

    try {
        if (stream) {
            setupStreamHeaders(res);
            await processChat(req, res);
        } else {
            const result = await processChat(req);
            return res.status(200).json(result);
        }
    } catch (error) {
        handleError(error, res, stream);
    }
};

/**
 * Procesa la lógica de negocio del chat con fallback secuencial
 */
async function processChat(req, res = null) {
    const { intent, message, history = [], userId, stream = false, vocal_scan = null, originPost = null, originCat = null, fileData = null } = req.body;

    if (intent === 'warmup') return { text: "OK" };
    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    // 1. Construir Contexto del Alumno
    let context = await buildUserContext(userId, intent, originPost, originCat);

    // Añadir Escaneo Vocal si existe
    if (vocal_scan) {
        context += `\n--- ESCANEO VOCAL EN TIEMPO REAL ---\n`;
        context += `- Volumen medio: ${vocal_scan.volumen} (0-1)\n`;
        context += `- Energía pico: ${vocal_scan.energia} (0-1)\n`;
        context += `- Estabilidad: ${vocal_scan.estabilidad} (0-1)\n`;
        context += `[SISTEMA: Comenta sutilmente este análisis solo si lo ves relevante para su estado emocional].\n`;
    }

    const finalPrompt = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;

    // --- CADENA DE REINTENTOS CON FALLBACK ---
    const errors = [];
    const hasMedia = fileData && ((fileData.mimeType && fileData.mimeType.startsWith('audio/')) || (fileData.data || (Array.isArray(fileData) && fileData.length > 0)));

    // Intento 1: Mistral (primario — servidores UE, Francia) — solo texto
    if (!hasMedia && process.env.MISTRAL_API_KEY) {
        try {
            console.log("🚀 Intentando con Mistral...");
            const result = await callMistralAPI({ intent, prompt: finalPrompt, history, stream, res, fileData });
            if (stream && res) return;
            return result;
        } catch (e) {
            console.warn("⚠️ Mistral falló:", e.message);
            errors.push(`Mistral: ${e.message}`);
            if (stream && res && res.writableEnded) throw e;
        }
    }

    // Intento 2: Gemini (Google) — texto + audio + imágenes
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("🚀 Intentando con Gemini...");
            const result = await callGeminiAPI({ intent, prompt: finalPrompt, history, stream, res, fileData });
            if (stream && res) return;
            return result;
        } catch (e) {
            console.warn("⚠️ Gemini falló:", e.message);
            errors.push(`Gemini: ${e.message}`);
            if (stream && res && res.writableEnded) throw e;
        }
    }

    throw new Error(`Todos los modelos fallaron: ${errors.join(" | ")}`);
}

/**
 * Recupera datos de Supabase para alimentar el prompt
 */
async function buildUserContext(userId, intent, originPost = null, originCat = null) {
    if (!userId && !originPost) return "";

    const needsContext = ['mentor_chat', 'mentor_briefing', 'alchemy_analysis', 'mentor_advisor', 'inspiracion_dia'].includes(intent);
    if (!needsContext) return "";

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    let context = "";

    if (originPost) {
        context += `\n--- ARTÍCULO LEÍDO (Contexto de Origen) ---\n`;
        context += `- Título: ${originPost}\n`;
        if (originCat) context += `- Categoría: ${originCat}\n`;
        context += `[SISTEMA: El alumno viene de leer este artículo. Salúdale mencionando que te alegra que lo haya leído y pregúntale qué le ha parecido o cómo resuena con su situación actual].\n`;
    }

    const { data: perfil } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
    if (!perfil) return context;

    context += `\n--- SITUACIÓN ACTUAL ---\n- Nombre: ${perfil.nombre}\n- Último Estado: ${perfil.ultimo_resumen || 'Iniciando'}\n`;

    // No aplicar las preferencias personalizadas de Ajustes cuando la intención sea 'inspiracion_dia'
    // para evitar que la frase pierda su tono inspirador o sea demasiado técnica/robótica.
    if (intent !== 'inspiracion_dia') {
        if (perfil.mentor_trato_preferido) {
            context += `- Trato Preferido: ${perfil.mentor_trato_preferido}\n`;
        }

        context += `\n--- PREFERENCIAS DE MENTORÍA ---\n`;
        if (perfil.mentor_focus !== undefined && perfil.mentor_focus !== null) {
            context += `- Nivel de Enfoque (1 Técnico, 10 Emocional): ${perfil.mentor_focus}/10\n`;
        }
        if (perfil.mentor_personality !== undefined && perfil.mentor_personality !== null) {
            context += `- Personalidad (1 Neutral, 10 Motivador): ${perfil.mentor_personality}/10\n`;
        }
        if (perfil.mentor_length !== undefined && perfil.mentor_length !== null) {
            context += `- Longitud de Respuesta (1 Breve, 10 Detallada): ${perfil.mentor_length}/10\n`;
        }

        context += `- Historia: ${perfil.historia_vocal}\n- Nivel: ${perfil.nivel_alquimia}/10\n`;
        context += `- Transmutaciones (Logros): ${perfil.creencias_transmutadas || 'Ninguna registrada'}\n`;
    }

    const userTier = perfil.subscription_tier || 'free';
    if ((userTier === 'pro' || userTier === 'premium') && intent !== 'inspiracion_dia') {
        const { data: cronicas } = await supabase.from('mensajes')
            .select('texto, created_at')
            .eq('alumno', userId)
            .eq('emisor', 'resumen_diario')
            .order('created_at', { ascending: false })
            .limit(7);

        if (cronicas?.length > 0) {
            context += `\n--- MEMORIA RECIENTE (Crónicas de Alquimia) ---\n`;
            cronicas.reverse().forEach(c => {
                context += `[${new Date(c.created_at).toLocaleDateString()}] ${c.texto}\n`;
            });
            context += `\n[SISTEMA: Usa estos datos para demostrar que recuerdas su evolución y no pedirle repetirse].\n`;
        }
    }

    return context;
}

/**
 * Ejecuta la llamada REST a Gemini (mantenido como fallback opcional)
 */
async function callGeminiAPI({ intent, prompt, history, stream, res, fileData }) {
    if (!process.env.GEMINI_API_KEY) throw new Error("Falta API Key de Gemini");

    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
    const modelToUse = GEMINI_MODEL;
    const url = `${GEMINI_BASE_URL}/${modelToUse}:${endpoint}?key=${process.env.GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`;

    const contents = [
        ...sanitizeGeminiHistory(history),
        { role: "user", parts: [{ text: prompt }] }
    ];

    if (fileData) {
        const lastContent = contents[contents.length - 1];
        const files = Array.isArray(fileData) ? fileData : [fileData];
        for (const file of files) {
            lastContent.parts.push({
                inlineData: {
                    mimeType: file.mimeType,
                    data: file.data
                }
            });
        }
    }

    const requestBody = {
        contents: contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[intent] }] }
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
        return handleStreamResponse(response, res);
    } else {
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
        return { text: text, info: modelToUse };
    }
}

/**
 * Maneja el flujo de datos SSE para streaming
 */
async function handleStreamResponse(response, res) {
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
                        if (text) {
                            res.write(`data: ${JSON.stringify({ text })}\n\n`);
                        }
                    } catch (e) { /* chunk incompleto */ }
                }
            }
        }
    } finally {
        res.end();
    }
}

/**
 * Ejecuta la llamada a Mistral AI (primario — servidores UE)
 */
async function callMistralAPI({ intent, prompt, history, stream, res, fileData }) {
    if (!process.env.MISTRAL_API_KEY) throw new Error("Falta API Key de Mistral");

    const hasAudio = fileData && fileData.mimeType && fileData.mimeType.startsWith('audio/');
    const hasImages = !hasAudio && fileData && (Array.isArray(fileData) ? fileData.length > 0 : fileData.data);

    const messages = [
        { role: "system", content: SYSTEM_PROMPTS[intent] },
        ...history.filter(h => h?.parts?.[0]?.text).map(h => ({
            role: h.role === 'model' ? 'assistant' : 'user',
            content: h.parts[0].text
        })),
        { role: "user", content: prompt }
    ];

    const requestBody = {
        model: MISTRAL_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1500,
        stream: !!stream
    };

    const response = await fetch(`${MISTRAL_BASE_URL}/chat/completions`, {
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
        return;
    } else {
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content || "";
        return { text, info: `${MISTRAL_MODEL} (UE)` };
    }
}

function setupStreamHeaders(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
}

function handleError(error, res, stream) {
    console.error("⛔ [Backend Chat Error]:", error);
    if (res.writableEnded) return;

    const msg = error.message.includes("Gemini Error") || error.message.includes("Mistral Error")
        ? "El Mentor está meditando profundamente... Prueba de nuevo."
        : "Error técnico temporal.";

    if (stream) {
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
    } else {
        res.status(500).json({ error: msg, details: error.message });
    }
}
