const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPTS = {
    mentor_chat: `Eres el Mentor de "Despierta tu Voz" (Canto Holístico). Enfoque: autoconciencia, no técnica tradicional.
REGLAS:
1. ESCUCHA: Acoge antes de guiar.
2. CIERRE: Si se despiden claramente, no solo con un gracias, di: "Recuerda cerrar sesión para que nuestro encuentro de hoy quede guardado en tu diario de alquimia. ¡Hasta pronto!". SÉ BREVE.
3. PROGRESO: No menciones niveles salvo que sean > 6/10.
4. VIAJE: Si no han completado el viaje, invita a "Mi viaje" tras 4 mensajes.
5. MEMORIA: Si el contexto incluye "RECUERDOS RECUPERADOS", úsalos para responder sobre el pasado con precisión.
6. ESTILO: Metáforas vitales, sentir como brújula, prudencia emocional. No repitas tags de contexto.`,
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

        // Si el error es una de nuestras validaciones, lo pasamos tal cual
        const knownErrors = ["Acceso denegado.", "Falta API Key", "Falta SUPABASE_SERVICE_ROLE_KEY", "Intento no válido", "Alumno no encontrado", "Error conexión IA"];
        const isKnown = knownErrors.some(k => error.message.includes(k));

        let msg = "Vaya, parece que hay un pequeño problema técnico. Prueba de nuevo en unos instantes.";
        if (isTimeout) {
            msg = "Vaya, parece que la IA está tardando demasiado. Prueba de nuevo en unos instantes.";
        } else if (isKnown) {
            msg = error.message;
        }

        return res.status(status).json({
            error: msg,
            details: error.message,
            isTimeout: isTimeout
        });
    }
};

async function processChat(req) {
    const { intent, message, history = [], userId, canRecommend, blogLibrary = [], mentorPassword = "" } = req.body;

    if (intent === 'warmup') {
        return { text: "OK", status: "Warmed up" };
    }

    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    if (intent === 'mentor_briefing') {
        const secretPass = process.env.MENTOR_PASSWORD;
        if (mentorPassword !== secretPass) throw new Error("Acceso denegado.");
    }

    let context = "";
    if (userId && (intent === 'mentor_chat' || intent === 'mentor_briefing' || intent === 'alchemy_analysis')) {
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("FATAL: Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.");
            throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY en la configuración del servidor.");
        }

        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        let perfil, viaje;

        // ESTRATEGIA: Carga quirúrgica para evitar Timeouts.
        if (intent === 'mentor_chat') {
            const { data, error } = await supabase.from('user_profiles')
                .select('nombre, historia_vocal, creencias, nivel_alquimia, mentor_notes, ultimo_resumen, last_hito_completed')
                .eq('user_id', userId)
                .maybeSingle();
            if (error) console.error("Error perfil:", error);
            perfil = data;
        } else {
            const [perfilRes, viajeRes] = await Promise.all([
                supabase.from('user_profiles')
                    .select('nombre, historia_vocal, creencias, nivel_alquimia, mentor_notes, ultimo_resumen, last_hito_completed')
                    .eq('user_id', userId)
                    .maybeSingle(),
                supabase.from('user_coaching_data')
                    .select('linea_vida_hitos, herencia_raices, roles_familiares, ritual_sanacion, plan_accion')
                    .eq('user_id', userId)
                    .maybeSingle()
            ]);

            if (perfilRes.error) console.error("Error perfilRes:", perfilRes.error);
            if (viajeRes.error) console.error("Error viajeRes:", viajeRes.error);

            perfil = perfilRes?.data;
            viaje = viajeRes?.data;
        }

        if (perfil) {
            context += `\n--- PERFIL ALUMNO ---\n- Nombre: ${perfil.nombre || 'N/A'}\n- Historia: ${perfil.historia_vocal || 'N/A'}\n- Creencias: ${perfil.creencias || 'N/A'}\n- Nivel: ${perfil.nivel_alquimia || 1}/10\n- Módulo actual: ${perfil.last_hito_completed || 0}/5\n- Notas Fer: ${perfil.mentor_notes || 'Ninguna'}\n- Resumen actual: ${perfil.ultimo_resumen || 'Sin resumen previo'}\n`;
        }
        if (viaje) {
            context += `\n--- DATOS DE "MI VIAJE" ---\n`;
            if (viaje.linea_vida_hitos) context += `- Hitos (M1): ${JSON.stringify(viaje.linea_vida_hitos)}\n`;
            if (viaje.herencia_raices) context += `- Raíces (M2): ${JSON.stringify(viaje.herencia_raices)}\n`;
            if (viaje.roles_familiares) context += `- Roles (M3): ${JSON.stringify(viaje.roles_familiares)}\n`;
            if (viaje.ritual_sanacion) context += `- Ritual (M4): ${JSON.stringify(viaje.ritual_sanacion)}\n`;
            if (viaje.plan_accion) context += `- Plan (M5): ${JSON.stringify(viaje.plan_accion)}\n`;
        }

        // --- BÚSQUEDA DINÁMICA DE MEMORIA ---
        const memoryTriggers = ["recordar", "hablamos", "dijiste", "comentamos", "conversación", "anterior", "pasado", "memoria", "busc", "encontr", "qué hablamos", "recordamos", "hace tiempo"];
        const lowerMsg = message.toLowerCase();
        const triggersMemory = memoryTriggers.some(t => lowerMsg.includes(t));

        if (triggersMemory && intent === 'mentor_chat') {
            const stopWords = ["recuerdas", "cuándo", "sobre", "hemos", "tenido", "podemos", "puedes", "decirme", "acerca", "alguna", "algún", "cuando", "estuvimos"];
            const keywords = message.toLowerCase()
                .replace(/[?,.;!]/g, "")
                .split(" ")
                .filter(w => w.length > 3 && !memoryTriggers.includes(w) && !stopWords.includes(w));

            if (keywords.length > 0) {
                const { data: records } = await supabase
                    .from('mensajes')
                    .select('texto, emisor, created_at')
                    .eq('alumno', userId)
                    .ilike('texto', `%${keywords[0]}%`)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (records && records.length > 0) {
                    context += `\n--- RECUERDOS RECUPERADOS (Búsqueda por "${keywords[0]}") ---\n`;
                    records.reverse().forEach(r => {
                        const date = new Date(r.created_at).toLocaleDateString();
                        context += `[${date}] ${r.emisor === 'ia' ? 'Mentor' : 'Alumno'}: ${r.texto.substring(0, 300)}${r.texto.length > 300 ? '...' : ''}\n`;
                    });
                }
            }
        }
    }

    if (intent === 'web_assistant') {
        try {
            // Intentar cargar la base de conocimiento local
            const knowledgePath = path.join(process.cwd(), 'knowledge', 'web_info.md');
            if (fs.existsSync(knowledgePath)) {
                const knowledge = fs.readFileSync(knowledgePath, 'utf8');
                context += `\n[BASE DE CONOCIMIENTO OFICIAL]\n${knowledge}\n`;
            }
        } catch (err) {
            console.error("Error al cargar la base de conocimiento:", err);
        }
    }

    if (!process.env.GEMINI_API_KEY) throw new Error("Falta API Key");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Modelos disponibles para 2026. Priorizamos el flash estable de Gemini 3 y 2.0.
    // Nota: El usuario reporta 404 en la familia 1.5, posiblmente por retiro/deprecación en su entorno.
    const models = ["gemini-3-flash", "gemini-2.0-flash", "gemini-3-flash-preview"];

    let sanitizedHistory = [];
    if (Array.isArray(history)) {
        let lastRole = null;
        sanitizedHistory = history.filter(h => {
            if (!h?.parts?.[0]?.text) return false;
            const role = h.role === 'model' ? 'model' : 'user';
            if (role === lastRole) return false;
            lastRole = role;
            return true;
        });

        // REGLAS CRÍTICAS DE GEMINI:
        // 1. El primer mensaje del historial DEBE ser del 'user'.
        while (sanitizedHistory.length > 0 && sanitizedHistory[0].role !== 'user') {
            sanitizedHistory.shift();
        }

        // 2. El historial debe terminar en 'model' para que el siguiente mensaje sea el del 'user' actual.
        // Si termina en 'user', Gemini da error al enviar el nuevo mensaje del usuario.
        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') {
            sanitizedHistory.pop();
        }
    }

    let errors = [];
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ systemInstruction: SYSTEM_PROMPTS[intent], model: modelName });

            const promptFinal = (context)
                ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}`
                : message;

            // Tiempo por modelo: 4s para permitir pasar al siguiente si hay lentitud sin agotar los 9s globales.
            const modelTimeout = new Promise((_, reject) => {
                setTimeout(() => reject(new Error("ModelTimeout")), 4000);
            });

            let result;
            if (sanitizedHistory.length > 0) {
                const chat = model.startChat({ history: sanitizedHistory });
                result = await Promise.race([chat.sendMessage(promptFinal), modelTimeout]);
            } else {
                result = await Promise.race([model.generateContent(promptFinal), modelTimeout]);
            }
            return { text: result.response.text() };
        } catch (e) {
            console.error(`Error en ${modelName}:`, e.message);
            errors.push(`${modelName}: ${e.message}`);
        }
    }

    /* 
    if (process.env.ANTHROPIC_API_KEY) {
        try {
            const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
            const promptFinal = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;
            const response = await anthropic.messages.create({
                model: "claude-3-5-sonnet-20241022",
                max_tokens: 1024,
                system: SYSTEM_PROMPTS[intent],
                messages: [
                    ...sanitizedHistory.map(h => ({ role: h.role === 'model' ? 'assistant' : 'user', content: h.parts[0].text })),
                    { role: "user", content: promptFinal }
                ],
            });
            return { text: response.content[0].text, info: "Claude Backup" };
        } catch (ce) { errors.push(`Claude: ${ce.message}`); }
    }
    */

    throw new Error(`Error conexión IA: ${errors.join(" | ")}`);
}
