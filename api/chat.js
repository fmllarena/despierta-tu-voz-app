const { createClient } = require('@supabase/supabase-js');
const { SYSTEM_PROMPTS } = require('./_lib/prompts');
const { sanitizeGeminiHistory } = require('./_lib/utils');

// --- SEGURIDAD DE GEMINI ---
// v1beta es necesario para usar systemInstruction. v1 no soporta ese campo.
const GEMINI_MODEL = "gemini-2.5-flash";
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
            // Timeout de 60s para peticiones normales (Vercel Hobby es 10s, pero manejamos el caso general)
            const result = await processChat(req);
            return res.status(200).json(result);
        }
    } catch (error) {
        handleError(error, res, stream);
    }
};

/**
 * Procesa la lógica de negocio del chat: contexto + IA
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

    // 2. Llamada a Gemini
    return await callGeminiAPI({
        intent,
        prompt: finalPrompt,
        history,
        stream,
        res,
        fileData
    });
}

/**
 * Recupera datos de Supabase para alimentar el prompt
 */
async function buildUserContext(userId, intent, originPost = null, originCat = null) {
    if (!userId && !originPost) return "";

    // Solo cargar contexto para intents que lo requieran
    const needsContext = ['mentor_chat', 'mentor_briefing', 'alchemy_analysis', 'mentor_advisor', 'inspiracion_dia'].includes(intent);
    if (!needsContext) return "";

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    let context = "";

    // Añadir contexto de origen si viene del blog (Prioridad alta para la IA)
    if (originPost) {
        context += `\n--- ARTÍCULO LEÍDO (Contexto de Origen) ---\n`;
        context += `- Título: ${originPost}\n`;
        if (originCat) context += `- Categoría: ${originCat}\n`;
        context += `[SISTEMA: El alumno viene de leer este artículo. Salúdale mencionando que te alegra que lo haya leído y pregúntale qué le ha parecido o cómo resuena con su situación actual].\n`;
    }

    const { data: perfil } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();

    if (!perfil) return context;

    context += `\n--- SITUACIÓN ACTUAL ---\n- Nombre: ${perfil.nombre}\n- Último Estado: ${perfil.ultimo_resumen || 'Iniciando'}\n`;

    if (intent !== 'inspiracion_dia') {
        context += `- Historia: ${perfil.historia_vocal}\n- Nivel: ${perfil.nivel_alquimia}/10\n`;
        context += `- Transmutaciones (Logros): ${perfil.creencias_transmutadas || 'Ninguna registrada'}\n`;
    }

    // Memoria Premium (Crónicas)
    const userTier = perfil.subscription_tier || 'free';
    if ((userTier === 'pro' || userTier === 'premium') && intent !== 'inspiracion_dia') {
        const { data: cronicas } = await supabase.from('mensajes')
            .select('texto, created_at')
            .eq('alumno', userId)
            .eq('emisor', 'resumen_diario')
            .order('created_at', { ascending: false })
            .limit(5); // Aumentamos a 5 para más profundidad

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
 * Ejecuta la llamada REST a Gemini
 */
async function callGeminiAPI({ intent, prompt, history, stream, res, fileData }) {
    if (!process.env.GEMINI_API_KEY) throw new Error("API Key no configurada");

    const endpoint = stream ? 'streamGenerateContent' : 'generateContent';

    // Selección dinámica de modelo: Pro 3.1 para archivos (mejor análisis), 2.5 Flash para chat (más rápido)
    const modelToUse = fileData ? "gemini-3.1-pro-preview" : GEMINI_MODEL;
    const url = `${GEMINI_BASE_URL}/${modelToUse}:${endpoint}?key=${process.env.GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`;

    const contents = [
        ...sanitizeGeminiHistory(history),
        {
            role: "user",
            parts: [{ text: prompt }]
        }
    ];

    // Si hay datos de archivo, los añadimos a la última entrada del usuario
    if (fileData) {
        const lastContent = contents[contents.length - 1];
        lastContent.parts.push({
            inlineData: {
                mimeType: fileData.mimeType,
                data: fileData.data
            }
        });
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
        return { text: text, info: GEMINI_MODEL };
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

// --- HELPERS AUXILIARES ---

function setupStreamHeaders(res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
}

function handleError(error, res, stream) {
    console.error("⛔ [Backend Chat Error]:", error);
    if (res.writableEnded) return;

    const msg = error.message.includes("Gemini Error") ? "El Mentor está meditando... (Error de IA)" : "Error técnico temporal.";

    if (stream) {
        res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
        res.end();
    } else {
        res.status(500).json({ error: msg, details: error.message });
    }
}
