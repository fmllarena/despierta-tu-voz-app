const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// --- NOTA PERMANENTE DE SEGURIDAD (ENERO 2026) ---
// ⚠️ NO INSTALAR NI USAR EL SDK DE GOOGLE PARA GEMINI EN ESTE PROYECTO.
// ⚠️ EL SDK ESTÁ FORZANDO LA VERSIÓN 'v1beta' QUE PRODUCE ERRORES 404.
// ✅ USAR SIEMPRE FETCH DIRECTO A 'v1' PARA MÁXIMA ESTABILIDAD.

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
    res.setHeader('Access-Control-Allow-Credentials', true).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT').setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    // Timeout global de 290 segundos (Sincronizado con el máximo de Vercel Pro de 300s)
    const globalTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("GlobalTimeout")), 290000);
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
        const isAIError = error.message.includes("Error conexión IA") || error.message.includes("Error fetching") || error.message.includes("Insufficient Balance") || error.message.includes("Timeout") || error.message.includes("404") || error.message.includes("not_found_error");

        let msg = "Vaya, parece que hay un pequeño problema técnico. Prueba de nuevo en unos instantes.";
        if (isTimeout) {
            msg = "¡Vaya! Parece que el Mentor hoy se ha puesto especialmente profundo y su respuesta está tardando un poco más de lo habitual. 🧘‍♂️ La sabiduría requiere su tiempo... ¿Podrias probar con una pregunta más directa?";
        } else if (isAIError) {
            msg = "Vaya, parece que el Mentor está recibiendo muchísimas consultas ahora mismo y su voz se ha quedado un poco en silencio. 🌿 Por favor, espera unos instantes y vuelve a intentarlo, ¡estoy deseando seguir conversando contigo!";
        } else if (isKnown) {
            msg = error.message;
        }

        return res.status(status).json({ error: msg, details: error.message, isAIError, isTimeout });
    }
};

async function processChat(req) {
    const { intent, message, history = [], userId, mentorPassword = "" } = req.body;
    if (intent === 'warmup') return { text: "OK" };
    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    if (intent === 'mentor_briefing') {
        if (mentorPassword !== process.env.MENTOR_PASSWORD) throw new Error("Acceso denegado.");
    }

    let context = "";
    if (userId && (intent === 'mentor_chat' || intent === 'mentor_briefing' || intent === 'alchemy_analysis')) {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const lowerMsg = message.toLowerCase();

        // Carga PROACTIVA: Siempre cargamos datos de coaching para el chat del mentor
        const needsCoaching = true;
        const triggersMemory = intent === 'mentor_chat' && ["recordar", "hablamos", "dijiste", "comentamos", "anterior", "pasado", "memoria", "acuerdas", "acodar", "sabes", "sabías"].some(t => lowerMsg.includes(t));

        const promises = [
            supabase.from('user_profiles').select('nombre, historia_vocal, ultimo_resumen').eq('user_id', userId).maybeSingle(),
            supabase.from('user_coaching_data').select('linea_vida_hitos, herencia_raices, roles_familiares, ritual_sanacion, plan_accion').eq('user_id', userId).maybeSingle()
        ];

        if (triggersMemory) {
            const noise = ["acuerdas", "hablamos", "dijiste", "comentamos", "anterior", "pasado", "memoria", "sobre", "puedes", "recordar", "sabes", "quiero", "tema", "algo", "sabías", "acordarte"];
            const keywords = message.toLowerCase().replace(/[?,.;!]/g, "").split(" ")
                .filter(w => w.length > 3 && !noise.includes(w))
                .sort((a, b) => b.length - a.length);

            if (keywords.length > 0) {
                const bestKeyword = keywords[0];
                console.log(`🧠 Memoria PROFUNDA ACTIVADA para: ${bestKeyword}`);
                // Ampliamos a 15 mensajes recuperados
                promises.push(supabase.from('mensajes').select('texto, emisor, created_at').eq('alumno', userId).ilike('texto', `%${bestKeyword}%`).order('created_at', { ascending: false }).limit(15));
            } else promises.push(Promise.resolve({ data: null }));
        } else {
            // Si no hay trigger de palabra clave, cargamos siempre los últimos 5 para mantener frescura
            promises.push(supabase.from('mensajes').select('texto, emisor, created_at').eq('alumno', userId).order('created_at', { ascending: false }).limit(5));
        }

        const [perfilRes, viajeRes, memoryRes] = await Promise.all(promises);

        console.log(`📊 [DEBUG Contexto] Perfil: ${perfilRes.data ? 'OK' : 'VACIÓ'}, Viaje: ${viajeRes.data ? 'OK' : 'VACIÓ'}, Memoria: ${memoryRes.data?.length || 0} filas.`);

        if (perfilRes.data) context += `\n--- PERFIL ---\n- Nombre: ${perfilRes.data.nombre}\n- Historia: ${perfilRes.data.historia_vocal}\n- Resumen: ${perfilRes.data.ultimo_resumen}\n`;
        if (viajeRes.data) context += `\n--- VIAJE ---\n${JSON.stringify(viajeRes.data)}\n`;
        if (memoryRes.data?.length > 0) {
            context += `\n--- MEMORIA RECUPERADA (Historial importante) ---\n`;
            memoryRes.data.reverse().forEach(r => {
                context += `[${new Date(r.created_at).toLocaleDateString()}] ${r.emisor}: ${r.texto}\n`;
            });
            console.log("📝 Contexto de memoria inyectado satisfactoriamente.");
        }
    }

    if (context) {
        console.log("🔗 Contexto Final (Primeros 100 char):", context.substring(0, 100));
    }

    const promptFinal = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;
    const isBriefing = intent === 'mentor_briefing';
    let errors = [];

    // --- CADENA DE MANDOS (EDICIÓN 2026: POTENCIA MÁXIMA) ---

    // 1. GEMINI (LÍDER - ACTUALIZADO A 3.0 FLASH)
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("🚀 Liderando con Gemini 3.0 Flash (Máxima profundidad 300s)...");
            const timeoutMs = isBriefing ? 285000 : 280000;

            const requestBody = {
                contents: [
                    ...formatHistoryForGeminiREST(history),
                    { role: "user", parts: [{ text: promptFinal }] }
                ],
                systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[intent] }] }
            };

            const geminiResponse = await Promise.race([
                fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3-flash:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }),
                new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), timeoutMs))
            ]);

            if (!geminiResponse.ok) {
                const errorData = await geminiResponse.json();
                throw new Error(`Gemini API Error: ${errorData.error?.message || geminiResponse.statusText}`);
            }

            const data = await geminiResponse.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error("Gemini devolvió una respuesta vacía.");

            return { text: text, info: "Gemini 3.0 Flash" };
        } catch (e) {
            console.warn("Fallo Gemini (Saltando a Claude):", e.message);
            errors.push(`Gemini: ${e.message}`);
        }
    }

    // 2. CLAUDE (FALLBACK ROBUSTO)
    if (process.env.ANTHROPIC_API_KEY) {
        const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
        const models = ["claude-haiku-4-5", "claude-sonnet-4-5", "claude-3-5-sonnet-20241022", "claude-3-5-sonnet-latest"];
        for (const modelName of models) {
            try {
                console.log(`🛡️ Fallback Claude: ${modelName}...`);
                const timeoutMs = isBriefing ? 275000 : 270000;
                const response = await Promise.race([
                    anthropic.messages.create({
                        model: modelName,
                        max_tokens: 1500,
                        system: SYSTEM_PROMPTS[intent],
                        messages: [...formatHistoryForClaude(history), { role: "user", content: promptFinal }],
                    }),
                    new Promise((_, r) => setTimeout(() => r(new Error("Timeout")), timeoutMs))
                ]);
                return { text: response.content[0].text, info: modelName };
            } catch (e) {
                console.warn(`Fallo Claude ${modelName}:`, e.message);
                errors.push(`${modelName}: ${e.message}`);
                if (e.message === "Timeout" && !isBriefing) break;
            }
        }
    }

    throw new Error(`Error conexión IA: ${errors.join(" | ")}`);
}

function formatHistoryForClaude(history) {
    if (!Array.isArray(history)) return [];
    return history.filter(h => h?.parts?.[0]?.text).map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text }));
}

function formatHistoryForGeminiREST(history) {
    if (!Array.isArray(history)) return [];
    let lastRole = null;
    let sanitized = history.filter(h => {
        if (!h?.parts?.[0]?.text) return false;
        const role = h.role === 'model' ? 'model' : 'user';
        if (role === lastRole) return false;
        lastRole = role;
        return true;
    }).map(h => ({
        role: h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.parts[0].text }]
    }));
    while (sanitized.length > 30) sanitized.shift(); // Limite de historial para no saturar contextos largos
    while (sanitized.length > 0 && sanitized[0].role !== 'user') sanitized.shift();
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === 'user') sanitized.pop();
    return sanitized;
}
