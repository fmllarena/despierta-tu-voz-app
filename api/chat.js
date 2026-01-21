const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// --- NOTA PERMANENTE DE SEGURIDAD (ENERO 2026) ---
// ⚠️ NO INSTALAR NI USAR EL SDK DE GOOGLE PARA GEMINI EN ESTE PROYECTO.
// ⚠️ EL SDK ESTÁ FORZANDO LA VERSIÓN 'v1beta' QUE PRODUCE ERRORES 404.
// ✅ USAR SIEMPRE FETCH DIRECTO A 'v1' PARA MÁXIMA ESTABILIDAD.

const SYSTEM_PROMPTS = {
    mentor_chat: `Eres el Mentor de "Despierta tu Voz" (Canto Holístico). Tu enfoque es el acompañamiento hacia la autoconciencia y el autoconocimiento a través de la voz, no la técnica tradicional.

ADN DE VOZ (Estilo Fernando Martínez):
1. ESCUCHA ACTIVA Y COMPASIVA: No asumas que vienen a por técnica. Quizás buscan consuelo, tienen nervios o un bloqueo. Sé infinitamente paciente y cálido. Si el alumno repite temas, es porque necesita profundizar con curiosidad compasiva.
2. LA METÁFORA VITAL: Conecta la voz con la vida y la naturaleza (raíces, nudos, fluir, alquimia). El sonido es medicina.
3. EL SENTIR COMO BRÚJULA: Invita al usuario a "sentir" antes de dar soluciones. Usa frases como "¿Qué tal si permitimos que...?" o "Te leo...".
4. PRUDENCIA EMOCIONAL: No menciones "creencias limitantes" o bloqueos profundos de entrada. Crea un espacio seguro primero.

REGLAS DE ORO:
- CIERRE: Si se despiden claramente, di EXACTAMENTE: "Recuerda cerrar sesión para que nuestro encuentro de hoy quede guardado en tu diario de alquimia. ¡Hasta pronto!". No confundas un "gracias" con un cierre.
- PROGRESO: No menciones niveles numéricos salvo que sean > 6/10 y solo de forma sutil.
- VIAJE: Si no han completado el viaje, invita a "Mi viaje" tras 4 interacciones de forma natural.
- MEMORIA: Usa la "SITUACIÓN ACTUAL" y "CRONOLOGÍA" para reconocer el camino recorrido. No pidas al alumno que se repita.
- TONO IA (CLAUDE/LLAMA): Evita el lenguaje corporativo, las listas numeradas excesivas o un tono autoritario/frío. Sé suave, profundo y humano. Usa un lenguaje evocador, no técnico.`,

    alchemy_analysis: `[SISTEMA: ANÁLISIS FINAL DE ALQUIMIA]
Tarea: Genera una reflexión profunda y poética del Mentor sobre el módulo completado.
REGLA DE ORO: Empiezas DIRECTAMENTE con el mensaje poético. NUNCA digas frases como "Tras analizar...", "Se detecta...", "Basado en tus respuestas...". Habla desde tu sabiduría.

1. Identifica el módulo por las respuestas.
2. Para Módulo 5 (Alquimia Final): Analiza su viaje completo, menciona hilos conductores y expande su visión.
3. Para Módulo 3 (Personaje): Analiza cómo su máscara le ha servido y cómo soltarla.
4. Para Módulo 4: Valida la vulnerabilidad mostrada.
5. Tono: Acogedor y humano. Extensión: 80-120 palabras.`,

    generate_questions: `Genera EXACTAMENTE 1 pregunta de coaching emocional profundo.
REGLAS:
1. Sé MUY original y creativo, no repitas conceptos previos.
2. Prioriza estado emocional, familia y autoestima.
3. Máximo 4 párrafos.
4. No fuerces la "voz" si el usuario no la ha mencionado.`,

    identify_limiting_belief: `Identifica la creencia limitante principal basada en el contexto. Devuelve SOLO la creencia en 1ª persona, breve y potente (máx 15 palabras).`,

    generate_action_plan: `Genera un plan de acción: 3 Objetivos SMART y una Rutina de Autocuidado (3 pasos). SOLO JSON: {"smart_goals": "...", "self_care_routine": "..."}`,

    mentor_briefing: `Eres el Mentor Estratégico. Genera un briefing para Fer (mentor humano).
ESTRUCTURA: 1. Perfil Psicodinámico, 2. Estado Actual (progreso/alquimia), 3. Estrategia Sesión 1/1 (consejos específicos). Tono directo y perspicaz.`,

    session_chronicle: "Eres el Cronista de Alquimia. Resume la sesión en un párrafo potente (máx 100 palabras). Incluye tema principal, un hallazgo ('clic') y palabras clave esenciales (ej: 'Allerseelen').",

    support_chat: `Eres el Asistente Técnico. Prioridad: problemas de acceso, errores o dudas de uso.
1. Tono: Profesional, servicial y directo.
2. No menciones planes/precios salvo que pregunten.
3. Planes: Explora (Gratis 1er mes), Profundiza (9,90€/mes), Transforma (79,90€/mes).
4. Redirección: Si es complejo, invita a WhatsApp.`,

    web_assistant: `Asistente Web. Informa sobre Despierta tu Voz usando [BASE DE CONOCIMIENTO]. 
REGLAS: 1. No des consejos técnicos (redirige a la App), 2. Tono cálido y profesional, 3. Objetivo: que prueben la App o se interesen por la mentoría.`
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

        // SISTEMA DE MEMORIA HÍBRIDA (Cronología + Profundidad)
        const promises = [
            supabase.from('user_profiles').select('nombre, historia_vocal, ultimo_resumen').eq('user_id', userId).maybeSingle(),
            supabase.from('user_coaching_data').select('linea_vida_hitos, herencia_raices, roles_familiares, ritual_sanacion, plan_accion').eq('user_id', userId).maybeSingle(),
            // 1. Contexto Inmediato: Últimos 10 mensajes (Chat fluido)
            supabase.from('mensajes').select('texto, emisor, created_at').eq('alumno', userId).order('created_at', { ascending: false }).limit(10),
            // 2. Contexto Evolutivo: Las últimas 10 Crónicas de Alquimia (Memoria a largo plazo)
            supabase.from('mensajes').select('texto, emisor, created_at').eq('alumno', userId).eq('emisor', 'resumen_diario').order('created_at', { ascending: false }).limit(10)
        ];

        // 2. Si detectamos intención de memoria o palabras específicas, buscamos profundo
        const triggersMemory = ["recordar", "hablamos", "dijiste", "comentamos", "anterior", "pasado", "memoria", "acuerdas", "acodar", "sabes", "sabías", "allerseelen"].some(t => lowerMsg.includes(t));

        if (triggersMemory) {
            const noise = ["acuerdas", "hablamos", "dijiste", "comentamos", "anterior", "pasado", "memoria", "sobre", "puedes", "recordar", "sabes", "quiero", "tema", "algo", "sabías", "acordarte"];
            const keywords = message.toLowerCase().replace(/[?,.;!]/g, "").split(" ")
                .filter(w => w.length > 3 && !noise.includes(w))
                .sort((a, b) => b.length - a.length);

            const keywordToSearch = keywords.length > 0 ? keywords[0] : null;
            if (keywordToSearch) {
                console.log(`🔍 [MEMORIA] Búsqueda profunda para palabra: "${keywordToSearch}" (User: ${userId})`);
                promises.push(supabase.from('mensajes').select('texto, emisor, created_at').eq('alumno', userId).ilike('texto', `%${keywordToSearch}%`).order('created_at', { ascending: false }).limit(15));
            } else {
                promises.push(Promise.resolve({ data: [] }));
            }
        } else {
            promises.push(Promise.resolve({ data: [] }));
        }

        const [perfilRes, viajeRes, recentRes, chronRes, deepRes] = await Promise.all(promises);

        // Unificar y deduplicar mensajes
        let allMessages = [...(recentRes.data || []), ...(chronRes.data || []), ...(deepRes.data || [])];
        const uniqueMessages = Array.from(new Map(allMessages.map(m => [`${m.created_at}_${m.texto.substring(0, 30)}`, m])).values());
        uniqueMessages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        console.log(`📊 [DEBUG Contexto] AlumnoID: ${userId.substring(0, 8)}... | Recientes: ${recentRes.data?.length || 0} | Crónicas: ${chronRes.data?.length || 0} | Profundos: ${deepRes.data?.length || 0} | Final: ${uniqueMessages.length} mensajes.`);

        if (perfilRes.data) context += `\n--- SITUACIÓN ACTUAL SINTETIZADA (Perfil General) ---\n- Nombre: ${perfilRes.data.nombre}\n- Historia Vocal: ${perfilRes.data.historia_vocal}\n- Último Estado del Alumno: ${perfilRes.data.ultimo_resumen}\n`;
        if (viajeRes.data) context += `\n--- DATOS DE VIAJE/COACHING ---\n${JSON.stringify(viajeRes.data)}\n`;

        if (uniqueMessages.length > 0) {
            context += `\n--- CRONOLOGÍA DE EVOLUCIÓN (Diario de Alquimia - Sesiones Pasadas) ---\n`;
            uniqueMessages.forEach(r => {
                const prefix = r.emisor === 'resumen_diario' ? '📌 HITO EVOLUTIVO (Crónica)' : r.emisor;
                context += `[${new Date(r.created_at).toLocaleDateString()}] ${prefix}: ${r.texto}\n`;
            });
            console.log("📝 Contexto de memoria (Crónicas y Chat) inyectado satisfactoriamente.");
        }
    }

    if (context) {
        console.log("🔗 Contexto Final (Primeros 100 char):", context.substring(0, 100));
    }

    const promptFinal = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;
    const isBriefing = intent === 'mentor_briefing';
    let errors = [];

    // --- CADENA DE MANDOS (EDICIÓN 2026: POTENCIA MÁXIMA) ---

    // 1. GEMINI (LÍDER PRIORITARIO - 3-FLASH PREVIEW)
    if (process.env.GEMINI_API_KEY) {
        try {
            console.log("🚀 Liderando con Gemini 3 Flash Preview...");
            const timeoutMs = isBriefing ? 285000 : 280000;

            const requestBody = {
                contents: [
                    ...formatHistoryForGeminiREST(history),
                    { role: "user", parts: [{ text: promptFinal }] }
                ],
                systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[intent] }] }
            };

            const geminiResponse = await Promise.race([
                fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(requestBody)
                }),
                new Promise((_, r) => setTimeout(() => r(new Error("Timeout Gemini")), timeoutMs))
            ]);

            if (!geminiResponse.ok) {
                const errorData = await geminiResponse.json().catch(() => ({}));
                console.error("❌ ERROR API GEMINI:", {
                    status: geminiResponse.status,
                    error: errorData.error
                });
                throw new Error(`Gemini API Error [${geminiResponse.status}]: ${errorData.error?.message || geminiResponse.statusText}`);
            }

            const data = await geminiResponse.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                console.error("❌ RESPUESTA VACÍA DE GEMINI:", JSON.stringify(data, null, 2));
                throw new Error("Gemini devolvió una respuesta vacía.");
            }

            return { text: text, info: "Gemini 3 Flash Preview" };
        } catch (e) {
            console.error("⛔ FALLO GEMINI:", e.message);
            errors.push(`Gemini: ${e.message}`);
        }
    }

    // 2. GROQ (BACKUP DE VELOCIDAD - LLAMA 3.3 70B)
    if (process.env.GROQ_API_KEY) {
        try {
            console.log("🚀 Backup con Groq (Llama 3.3 70B)...");
            const timeoutMs = isBriefing ? 60000 : 30000;

            const groqResponse = await Promise.race([
                fetch("https://api.groq.com/openai/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        model: "llama-3.3-70b-versatile",
                        messages: [
                            { role: "system", content: SYSTEM_PROMPTS[intent] },
                            ...formatHistoryForGroq(history),
                            { role: "user", content: promptFinal }
                        ],
                        temperature: 0.7,
                        max_tokens: 1500
                    })
                }),
                new Promise((_, r) => setTimeout(() => r(new Error("Timeout Groq")), timeoutMs))
            ]);

            if (!groqResponse.ok) {
                const errorData = await groqResponse.json();
                throw new Error(`Groq API Error: ${errorData.error?.message || groqResponse.statusText}`);
            }

            const data = await groqResponse.json();
            const text = data.choices?.[0]?.message?.content;
            if (!text) throw new Error("Groq devolvió una respuesta vacía.");

            return { text: text, info: "Groq (Llama 3.3 70B)" };
        } catch (e) {
            console.warn("⚠️ Fallo Groq (Saltando a Claude):", e.message);
            errors.push(`Groq: ${e.message}`);
        }
    }

    // 3. CLAUDE (FALLBACK ROBUSTO)
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

function formatHistoryForGroq(history) {
    if (!Array.isArray(history)) return [];
    return history.filter(h => h?.parts?.[0]?.text).map(h => ({
        role: h.role === 'model' ? 'assistant' : 'user',
        content: h.parts[0].text
    }));
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
