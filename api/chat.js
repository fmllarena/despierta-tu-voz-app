const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPTS = {
    mentor_chat: `Eres el Mentor de "Despierta tu Voz" (Canto Holístico). Enfoque: autoconciencia, no técnica tradicional.
REGLAS:
1. ESCUCHA: Acoge el sentir del alumno. Evita saludos genéricos (como "¡Hola!") si detectas que ya está respondiendo a tu apertura de sesión. Ve directo al corazón de lo que te cuenta.
2. CIERRE: Si se despiden claramente, no solo con un gracias, di: "Recuerda cerrar sesión para que nuestro encuentro de hoy quede guardado en tu diario de alquimia. ¡Hasta pronto!". SÉ BREVE.
3. PROGRESO: No menciones niveles salvo que sean > 6/10 y solo de vez en cuando.
4. VIAJE: Si no han completado el viaje, invita a "Mi viaje" tras 4 mensajes.
5. MEMORIA: Si el contexto incluye "RECUERDOS RECUPERADOS", úsalos para responder sobre el pasado con precisión.
6. ESTILO: Metáforas vitales, sentir como brújula, para que el sonido sea medicina.`,
    alchemy_analysis: `Análisis poético directo (80-120 palabras). Sin preámbulos. Habla desde la sabiduría del Mentor sobre el módulo completado.`,
    generate_questions: `Genera 1 pregunta de coaching original. Máx 4 párrafos. No repetir conceptos.`,
    identify_limiting_belief: `Identifica creencia limitante principal. Responde en 1ª persona (máx 15 palabras).`,
    generate_action_plan: `3 Objetivos SMART y Rutina Autocuidado. SOLO JSON: {"smart_goals": "...", "self_care_routine": "..."}`,
    mentor_briefing: `Eres el Mentor Estratégico. Analiza los datos del alumno para preparar a Fer (el mentor humano) para su sesión 1/1.
ESTRUCTURA DEL INFORME:
1. PERFIL PSICODINÁMICO: Quién es el alumno según su historia vocal y creencias limitantes.
2. ESTADO ACTUAL: Resumen de su progreso y nivel de alquimia.
3. ESTRATEGIA PARA LA SESIÓN 1/1: Consejos específicos, qué hilos tirar y cómo abordar sus bloqueos en el encuentro de hoy.
Usa un tono profesional, directo y perspicaz.`,
    support_chat: `Eres el Asistente Técnico de Despierta tu Voz. Tu objetivo es resolver dudas sobre el funcionamiento de la app, acceso y problemas técnicos de forma directa, amable y servicial. No menciones precios ni intentes vender planes de suscripción. Si no puedes resolver un problema técnico, invita al usuario a contactar por WhatsApp para asistencia humana.`,
    web_assistant: `Asistente Web. Informa sobre Despierta tu Voz usando [BASE DE CONOCIMIENTO]. Sin técnica. Objetivo: probar la App.`
};

module.exports = async function handler(req, res) {
    // SOPORTE CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    // Timeout global de 9 segundos para evitar el error de Vercel (10s límite)
    const globalTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("GlobalTimeout")), 9000);
    });

    try {
        const result = await Promise.race([processChat(req), globalTimeout]);
        return res.status(200).json(result);
    } catch (error) {
        console.error("DEBUG ERR [chat.js]:", error);

        const isTimeout = error.message === "GlobalTimeout";
        const status = isTimeout ? 504 : 500;

        const knownErrors = ["Acceso denegado.", "Falta API Key", "Falta SUPABASE_SERVICE_ROLE_KEY", "Intento no válido", "Alumno no encontrado"];
        const isKnown = knownErrors.some(k => error.message.includes(k));

        const isAIError = error.message.includes("Error conexión IA") ||
            error.message.includes("Error fetching") ||
            error.message.includes("Insufficient Balance") ||
            error.message.includes("ModelTimeout") ||
            error.message.includes("404") ||
            error.message.includes("not_found_error") ||
            error.message.includes("Timeout");

        let msg = "Vaya, parece que hay un pequeño problema técnico. Prueba de nuevo en unos instantes.";

        if (isTimeout) {
            msg = "¡Vaya! Parece que el Mentor se ha quedado sumergido en una meditación profunda intentando procesar toda la información y se ha olvidado del tiempo. 🧘‍♂️ ¿Podrías hacerme una pregunta un poco más corta o sencilla? Así podré responderte con más agilidad.";
        } else if (isAIError) {
            msg = "Vaya, parece que el Mentor está recibiendo muchísimas consultas ahora mismo y su voz se ha quedado un poco en silencio. 🌿 Por favor, espera unos instantes y vuelve a intentarlo, ¡estoy deseando seguir conversando contigo!";
        } else if (isKnown) {
            msg = error.message;
        }

        return res.status(status).json({
            error: msg,
            details: error.message,
            isAIError: isAIError,
            isTimeout: isTimeout
        });
    }
};

async function processChat(req) {
    const { intent, message, history = [], userId, mentorPassword = "" } = req.body;

    if (intent === 'warmup') return { text: "OK" };
    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    if (intent === 'mentor_briefing') {
        const secretPass = process.env.MENTOR_PASSWORD;
        if (mentorPassword !== secretPass) throw new Error("Acceso denegado.");
    }

    let context = "";
    if (userId && (intent === 'mentor_chat' || intent === 'mentor_briefing' || intent === 'alchemy_analysis')) {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const lowerMsg = message.toLowerCase();

        const needsCoaching = intent === 'mentor_briefing' || ["viaje", "hitos", "raíces", "familia", "ritual", "plan", "coaching", "módulo", "ejercicio"].some(t => lowerMsg.includes(t));
        const triggersMemory = intent === 'mentor_chat' && ["recordar", "hablamos", "dijiste", "comentamos", "anterior", "pasado", "memoria"].some(t => lowerMsg.includes(t));

        const promises = [
            supabase.from('user_profiles').select('nombre, historia_vocal, ultimo_resumen').eq('user_id', userId).maybeSingle()
        ];

        if (needsCoaching) {
            promises.push(supabase.from('user_coaching_data').select('linea_vida_hitos, herencia_raices, roles_familiares, ritual_sanacion, plan_accion').eq('user_id', userId).maybeSingle());
        } else promises.push(Promise.resolve({ data: null }));

        if (triggersMemory) {
            const keywords = message.toLowerCase().replace(/[?,.;!]/g, "").split(" ").filter(w => w.length > 3);
            if (keywords.length > 0) {
                promises.push(supabase.from('mensajes').select('texto, emisor, created_at').eq('alumno', userId).ilike('texto', `%${keywords[0]}%`).order('created_at', { ascending: false }).limit(5));
            } else promises.push(Promise.resolve({ data: null }));
        } else promises.push(Promise.resolve({ data: null }));

        const [perfilRes, viajeRes, memoryRes] = await Promise.all(promises);

        if (perfilRes.data) {
            const p = perfilRes.data;
            context += `\n--- PERFIL ---\n- Nombre: ${p.nombre}\n- Historia: ${p.historia_vocal}\n- Resumen: ${p.ultimo_resumen}\n`;
        }
        if (viajeRes.data) context += `\n--- VIAJE ---\n${JSON.stringify(viajeRes.data)}\n`;
        if (memoryRes.data?.length > 0) {
            context += `\n--- MEMORIA ---\n`;
            memoryRes.data.reverse().forEach(r => context += `[${new Date(r.created_at).toLocaleDateString()}] ${r.emisor}: ${r.texto}\n`);
        }
    }

    const promptFinal = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;
    const isBriefing = intent === 'mentor_briefing';
    let errors = [];

    // --- CADENA DE MANDOS (FALLBACK) ---

    // 1. CLAUDE (HAIKU 4.5 -> SONNET 4 -> SONNET 3.5 -> HAIKU 3.5)
    if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const models = ["claude-4-5-haiku-20251015", "claude-4-sonnet-20251015", "claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022"];

        for (const modelName of models) {
            try {
                console.log(`Intentando Claude: ${modelName}...`);
                // Tiempo: Para briefings damos hasta 8s, para chat normal 4s.
                const timeoutMs = isBriefing ? 8000 : 4000;
                const response = await Promise.race([
                    anthropic.messages.create({
                        model: modelName,
                        max_tokens: 1500,
                        system: SYSTEM_PROMPTS[intent],
                        messages: [...formatHistoryForClaude(history), { role: "user", content: promptFinal }],
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), timeoutMs))
                ]);
                return { text: response.content[0].text, info: modelName };
            } catch (e) {
                console.warn(`Fallo Claude ${modelName}:`, e.message);
                errors.push(`${modelName}: ${e.message}`);
                if (e.message === "Timeout") break; // Si da timeout, no seguimos perdiendo tiempo en Vercel
            }
        }
    }

    // 2. GEMINI (BACKUP)
    if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        try {
            console.log("Fallback: Intentando Gemini...");
            const model = genAI.getGenerativeModel({ systemInstruction: SYSTEM_PROMPTS[intent], model: "gemini-1.5-flash" });
            const sanitizedHistory = formatHistoryForGemini(history);
            let result;
            if (sanitizedHistory.length > 0) {
                const chat = model.startChat({ history: sanitizedHistory });
                result = await Promise.race([
                    chat.sendMessage(promptFinal),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                ]);
            } else {
                result = await Promise.race([
                    model.generateContent(promptFinal),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 8000))
                ]);
            }
            return { text: result.response.text(), info: "Gemini 1.5 Flash" };
        } catch (e) {
            console.error("Fallo Gemini:", e.message);
            errors.push(`Gemini: ${e.message}`);
        }
    }

    throw new Error(`Error conexión IA: ${errors.join(" | ")}`);
}

function formatHistoryForClaude(history) {
    if (!Array.isArray(history)) return [];
    return history.filter(h => h?.parts?.[0]?.text).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
    }));
}

function formatHistoryForGemini(history) {
    if (!Array.isArray(history)) return [];
    let lastRole = null;
    let sanitized = history.filter(h => {
        if (!h?.parts?.[0]?.text) return false;
        const role = h.role === 'model' ? 'model' : 'user';
        if (role === lastRole) return false;
        lastRole = role;
        return true;
    });
    while (sanitized.length > 0 && sanitized[0].role !== 'user') sanitized.shift();
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === 'user') sanitized.pop();
    return sanitized;
}
