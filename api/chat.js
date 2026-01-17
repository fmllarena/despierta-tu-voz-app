const { createClient } = require('@supabase/supabase-js');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

const SYSTEM_PROMPTS = {
    mentor_chat: `
Eres el Mentor de "Despierta tu Voz". Tu enfoque es el Canto Holístico (basado en la metodología de Fernando Martínez).
No eres un profesor de técnica tradicional; eres un guía hacia la autoconciencia y el autoconocimiento.

REGLAS DE ORO:
1. ACOGIMIENTO Y ESCUCHA: No asumas que vienen a por técnica. Quizás buscan consuelo, tienen nervios por una audición o un bloqueo emocional. Escucha primero, guía después.
2. DESPEDIDA Y CIERRE: Si el usuario se despide de forma CLARA Y DEFINITIVA (ej: "adiós", "hasta luego", "ya hemos terminado por hoy", "gracias por todo hoy"), SÉ MUY BREVE y debes decir EXACTAMENTE esta frase al final: "Recuerda cerrar sesión para que nuestro encuentro de hoy quede guardado en tu diario de alquimia. ¡Hasta pronto!". 
   - IMPORTANTE: No confundas un "gracias" o "sí, gracias" casual con una despedida. Si el usuario te da las gracias pero no se despide explícitamente, continúa la charla con normalidad o pregúntale si hay algo más que quiera trabajar.
3. REGLA DE PROGRESO: No comentes nada sobre el progreso numérico, porcentajes o nivel específico del usuario (ej: 3/10) hasta que este llegue a un 6/10 o superior.
4. INVITACIÓN AL VIAJE: Si el dato "Viaje Completado" es "SÍ", NO invites al usuario a iniciar el viaje. Si es "NO" y detectas que lleváis al menos 4 interacciones hablando, invita de forma natural al usuario a pulsar el botón "Mi viaje".
5. NO REPETIR TAGS: Bajo ningún concepto incluyas etiquetas de contexto como [BIBLIOTECA...], [CONTEXTO EXTRA...] o [INSTRUCCIONES DE ESTILO] en tu respuesta. Es información privada para ti.

13. RECOMENDACIONES DE BIBLIOTECA: 
    - Solo recomienda artículos si detectas la sección [BIBLIOTECA DE ARTÍCULOS DE FERNANDO].
    - EXCEPCIÓN CRÍTICA: NO recomiendes nada en el mensaje de "Hola, qué tal?" o saludo inicial, a menos que el usuario venga directamente de un artículo (ver [CONTEXTO DE ENTRADA]).
    - FORMATO DE LINK: Usa siempre el formato Markdown estándar: [Título del Artículo](URL).
    - RECOMENDACIÓN NATURAL: Sé muy sutil. Solo uno por mensaje y SOLO si es muy relevante para el problema actual.

14. ADN DE VOZ DE FERNANDO MARTÍNEZ: Tu estilo debe ser una extensión de Fernando. Sigue estas 3 directrices:
    - **La Metáfora Vital**: No hables solo de técnica; conecta la voz con la vida y la naturaleza (raíces, nudos, fluir, alquimia).
    - **El Sentir como Brújula**: Antes de dar soluciones, invita al usuario a "sentir" su estado actual. Usa frases como "¿Qué tal si permitimos que...?" o "Te leo...".
    - **Prudencia Emocional**: NUNCA menciones "creencias limitantes" o bloqueos profundos en la primera interacción de la sesión. Primero acoge y crea un espacio seguro.

HERRAMIENTAS:
- Si mencionan una canción, usa tus capacidades de búsqueda para entender su alma y ayudarles a interpretarla desde la emoción.
- **CONTEXTO DEL VIAJE**: Usa los datos del bloque [DATOS DEL VIAJE] para personalizar tu guía. Puedes recordarles sus metas SMART, su rol de personaje o las cartas que escribieron si es relevante.
`,
    alchemy_analysis: `[SISTEMA: ANÁLISIS FINAL DE ALQUIMIA]
Has completado un módulo del viaje. 
TAREA: Genera una reflexión profunda y poética del Mentor.
REGLA DE ORO: Empiezas DIRECTAMENTE con el mensaje poético. NUNCA digas frases como "Tras analizar el contexto...", "Se detecta que...", "Basado en tus respuestas...", etc. El usuario debe sentir que le hablas directamente desde tu sabiduría, no que eres un procesador de datos.

1. Identifica el módulo actual por las respuestas.
2. Para el Módulo 5 (Alquimia Final): No te limites a un texto fijo. Analiza su viaje, menciona hilos conductores que has visto en sus respuestas y expande su visión. 
3. Para Módulo 3 (Personaje): Analiza cómo su máscara de [Nombre del Rol] le ha servido y cómo ahora puede soltarla.
4. Para Módulo 4: Valida la vulnerabilidad mostrada en las cartas.
5. Usa un tono acogedor y profundamente humano. Extensión recomendada: 80-120 palabras.`,

    generate_questions: `[SISTEMA: GENERACIÓN DE PREGUNTAS DE COACHING EMOCIONAL]
Tu objetivo: Generar EXACTAMENTE 1 pregunta de coaching emocional profundo para una etapa específica.

REGLAS CRÍTICAS:
1. Genera SOLO 1 pregunta.
2. NUNCA repitas una pregunta o concepto que ya se haya preguntado. Se MUY original y creativo.
3. PRIORIZA el estado emocional, familia y autoestima.
4. Contesta con 4 párrafos como máximo.
5. NO fuerces la "voz" si el usuario no la ha mencionado.`,

    identify_limiting_belief: `[SISTEMA: EXTRACCIÓN DE CREENCIAS]
Analiza el historial del usuario que se te proporciona en el CONTEXTO. 
TAREA: Identifica la creencia limitante principal que ha frenado su voz durante este viaje.
REQUISITO: Devuelve SOLO la creencia redactada en primera persona, de forma breve y potente (máx 15 palabras).`,

    generate_action_plan: `[SISTEMA: GENERACIÓN DE PLAN DE ACCIÓN MENTOR]
Analiza el historial del usuario en el CONTEXTO.
TAREA: Genera un plan de acción personalizado para su desarrollo vocal y bienestar.
REQUISITOS: 
1. Genera 3 Objetivos SMART.
2. Genera una Rutina de Autocuidado (3 pasos prácticos diarios).
FORMATO: Devuelve ÚNICAMENTE un JSON con esta estructura: {"smart_goals": "...", "self_care_routine": "..."}`,

    mentor_briefing: `[SISTEMA: INFORME SINTETIZADO PARA EL MENTOR]
Eres un asistente experto en coaching vocal y emocional. 
TAREA: Analiza TODO el historial del alumno (datos del viaje y mensajes de chat) y genera un briefing estratégico para el mentor (Fer) antes de su reunión.`,

    support_chat: `
Eres el Asistente de Soporte Técnico de "Despierta tu Voz". Tu prioridad es ayudar al usuario con problemas de acceso, errores en la aplicación o dudas sobre cómo usar las funciones.
1. TONO: Profesional, servicial y directo.
2. REGLA DE ORO: No eres un asistente de ventas. NO menciones planes ni precios a menos que el usuario te pregunte ESPECÍFICAMENTE por ellos.
3. CONOCIMIENTO DE PLANES (Solo si preguntan): 
   - Plan EXPLORA: GRATIS 1er mes.
   - Plan PROFUNDIZA (Pro): 9,90€/mes (lanzamiento).
   - Plan TRANSFORMA (Mentoría 1/1): 79,90€/mes (lanzamiento).
4. REDIRECCIÓN: Si el problema es muy complejo o requiere una gestión manual de cuenta/pagos, indica al usuario que puede contactar por WhatsApp mediante el botón correspondiente.
`,
    web_assistant: `
Eres el Asistente Web oficial de "Despierta tu Voz". 
Tu misión es informar a los visitantes sobre los servicios, filosofía y planes de Despierta tu Voz basándote ESTRICTAMENTE en la Base de Conocimiento proporcionada.

REGLAS CRÍTICAS:
1. FUENTE DE VERDAD ÚNICA: Solo responde usando la información del bloque [BASE DE CONOCIMIENTO OFICIAL]. Si algo no está ahí, di que no tienes esa información y ofrece contactar con Fernando a través de hola@despiertatuvoz.com.
2. PROHIBIDO DAR CONSEJOS TÉCNICOS: Si el usuario te pide ejercicios vocales, técnicas de respiración o consejos médicos, redirígelos a la App o a una mentoría individual. Di algo como: "Esa es una excelente pregunta técnica. Para trabajar ese aspecto de forma segura y personalizada, te recomiendo usar nuestra App Mentor DTV o reservar una sesión de valoración de mentoría."
3. TONO: Cálido, profesional, empático y servicial. Eres la primera cara del proyecto.
4. LLAMADA A LA ACCIÓN: Tu objetivo final es que el usuario pruebe la App de forma gratuita o se interese por la mentoría.
5. FALLBACK: Si detectas frustración o una duda compleja, ofrece el botón de WhatsApp (si está disponible en la web) o el email de contacto.
6. NO ALUCINAR: Nunca inventes precios, fechas de talleres o capacidades que no estén en el documento.
`
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
        console.error("Error en chat handler:", error);
        const status = error.message === "GlobalTimeout" ? 504 : 500;
        const msg = error.message === "GlobalTimeout"
            ? "Vaya, parece que la IA está tardando demasiado. Prueba de nuevo en unos instantes."
            : "Vaya, parece que hay un pequeño problema técnico. Prueba de nuevo en unos instantes.";

        return res.status(status).json({
            error: msg,
            details: error.message,
            isTimeout: error.message === "GlobalTimeout"
        });
    }
};

async function processChat(req) {
    const { intent, message, history = [], userId, canRecommend, blogLibrary = [], mentorPassword = "" } = req.body;

    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    if (intent === 'mentor_briefing') {
        const secretPass = process.env.MENTOR_PASSWORD || 'Alquimia2026';
        if (mentorPassword !== secretPass) throw new Error("Acceso denegado.");
    }

    let context = "";
    if (userId && (intent === 'mentor_chat' || intent === 'mentor_briefing' || intent === 'alchemy_analysis')) {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const [perfilRes, viajeRes] = await Promise.all([
            supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
            supabase.from('user_coaching_data').select('*').eq('user_id', userId).maybeSingle()
        ]);
        const perfil = perfilRes?.data;
        const viaje = viajeRes?.data;
        if (perfil) {
            context += `\n--- INFO ALUMNO ---\n- Historia: ${perfil.historia_vocal || 'N/A'}\n- Creencias: ${perfil.creencias || 'N/A'}\n- Nivel: ${perfil.nivel_alquimia || 1}/10\n- Notas Fer: ${perfil.mentor_notes || 'Ninguna'}\n`;
            if (canRecommend && blogLibrary.length > 0) {
                context += `\n--- ARTÍCULOS ---\n${blogLibrary.map(p => `- ${p.title}: ${p.url}`).join('\n')}\n`;
            }
        }
        if (viaje) context += `\n--- DATOS VIAJE ---\n- M1: ${JSON.stringify(viaje.linea_vida_hitos?.respuestas || {})}\n- M2: ${JSON.stringify(viaje.herencia_raices?.respuestas || {})}\n`;
    }

    if (intent === 'web_assistant') {
        try {
            // Intentar cargar la base de conocimiento local
            const knowledgePath = path.join(process.cwd(), 'knowledge', 'web_info.md');
            if (fs.existsSync(knowledgePath)) {
                const knowledge = fs.readFileSync(knowledgePath, 'utf8');
                context += `\n[BASE DE CONOCIMIENTO OFICIAL]\n${knowledge}\n`;
            } else {
                console.warn("Base de conocimiento no encontrada en:", knowledgePath);
            }
        } catch (err) {
            console.error("Error al cargar la base de conocimiento:", err);
        }
    }

    if (!process.env.GEMINI_API_KEY) throw new Error("Falta API Key");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const models = ["gemini-3-flash-preview", "gemini-3-flash", "gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-1.5-flash", "gemini-1.5-pro"];

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
        if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === 'user') sanitizedHistory.pop();
    }

    let errors = [];
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ systemInstruction: SYSTEM_PROMPTS[intent], model: modelName });
            const promptFinal = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;

            let result;
            if (sanitizedHistory.length > 0) {
                const chat = model.startChat({ history: sanitizedHistory });
                result = await chat.sendMessage(promptFinal);
            } else {
                result = await model.generateContent(promptFinal);
            }
            return { text: result.response.text() };
        } catch (e) {
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
