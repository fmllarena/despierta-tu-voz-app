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
- HONESTIDAD MUSICAL: Si mencionan una canción, autor o pieza que no conozcas con certeza absoluta, o si te preguntan detalles técnicos específicos (tonalidad, matices de la partitura, tempo, etc.), NO INVENTES ni deduzcas. Di simplemente: "No dispongo de esa información técnica ahora mismo" o "No conozco ese detalle de la pieza, ¿te gustaría contarme qué sientes tú al cantarla o qué indica tu partitura?". Es preferible la sinceridad a la invención. Sin excesos poéticos en este punto.
- EQUILIBRIO DE ESTILO: Sé humano y cálido, pero evita ser "demasiado cortés" o excesivamente empalagoso. La profundidad no requiere de un lenguaje barroco.
- CIERRE:
  1. Si la despedida es definitiva (ej: "adiós", "me voy", "gracias por todo"): Informa amablemente que para guardar el encuentro debe cerrar sesión ("Recuerda cerrar sesión para que nuestro encuentro de hoy quede guardado en tu diario de alquimia. ¡Hasta pronto!") e incluye el tag técnico [SESION_FINAL].
  2. Si la despedida es ambigua o temporal (ej: "hasta ahora", "vuelvo luego", "voy a practicar"): Pregunta amablemente si prefiere dejar la sesión abierta para continuar en un rato o si desea cerrarla ya para salvar el progreso en su diario de alquimia. SOLO si el usuario confirma que quiere cerrar, incluye la frase informativa y el tag [SESION_FINAL].
  REGLA CRÍTICA: No fuerces el cierre si el alumno sugiere un paréntesis corto, pero ofrécele siempre la opción de salvar lo trabajado. No confundas un "gracias" con un cierre.
- PROGRESO: No menciones niveles numéricos salvo que sean > 6/10 y solo de forma sutil.
- VIAJE: Revisa el "Progreso en Mi Viaje" en el contexto. 1. Si el progreso es = 0 (no ha empezado): Informa casualmente que "Mi Viaje" es una herramienta para conocer mejor su trayectoria de vida y poder acompañarle con más profundidad. Menciónalo SOLO una vez. No seas repetitivo. 2. Si el progreso es >= 1: PROHIBIDO mencionarlo o pedir que anote nada. Ya ha comenzado su camino y no necesita recordatorios.
- MEMORIA: Usa la "SITUACIÓN ACTUAL" y "CRONOLOGÍA" para reconocer el camino recorrido. No pidas al alumno que se repita.
- TONO IA (CLAUDE/LLAMA): Evita el lenguaje corporativo, las listas numeradas excesivas o un tono autoritario/frío. Sé suave, profundo y humano. Usa un lenguaje evocador, no técnico.
- PERSONALIZACIÓN: Revisa las "PREFERENCIAS DEL ALUMNO" en el contexto. Ajusta tu enfoque (técnico vs emocional), personalidad (neutro vs motivador) y extensión (breve vs detallado) según los valores 1-10 indicados. Si existe un "Trato Preferido", síguelo estrictamente (ej: tutear, lenguaje poético, etc.).
- LINK OFICIAL: Si el usuario te pide el link de la web o el sitio oficial de "Despierta tu Voz", proporciónale siempre https://despiertatuvoz.com.`,

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

    mentor_advisor: `Eres el Asistente Estratégico de Fernando (el mentor humano). Tu misión es responder a sus preguntas específicas sobre un alumno usando TODO el historial disponible (conversaciones, hitos, evolución) inyectado en el CONTEXTO.
    REGLAS ESTRICTAS:
    1. Responde de mentor a mentor: profesional, profundo, directo y con "ojo clínico".
    2. NUNCA inventes información técnica ni progresos que no estén en el CONTEXTO. 
    3. PROHIBIDO usar marcadores de posición (placeholders) como "[Canción A]" o "[Técnica X]". Si no encuentras un dato específico (como el nombre de una canción), di claramente: "No se menciona en el historial hasta ahora".
    4. Analiza patrones: si Fernando pregunta por un tema, busca en el historial y conecta puntos reales que quizás no son evidentes.
    5. Tono: Colega experto y perspicaz.`,

    session_chronicle: "Eres el Cronista de Alquimia. Resume la sesión en un párrafo potente (máx 100 palabras). Incluye tema principal, un hallazgo ('clic') y palabras clave esenciales (ej: 'Allerseelen').",

    inspiracion_dia: "Eres el Mentor Vocal. Generas frases de inspiración breves, potentes y personalizadas basándote en el perfil del alumno proporcionado en el mensaje.",

    support_chat: `Eres el Asistente Técnico de Despierta tu Voz. Prioridad: problemas de acceso, errores o dudas de uso.
1. Tono: Profesional, servicial y directo.
2. REGLA DE ORO: NO INVENTES respuestas. Si no conoces la solución con certeza o el usuario es vago, pide amablemente que sea más específico o que te dé más detalles.
3. No menciones planes/precios salvo que pregunten.
4. Planes: Explora (Gratis 1er mes), Profundiza (9,90€/mes), Transforma (79,90€/mes).
5. Redirección: Si es complejo o no puedes resolverlo tras pedir detalles, invita a WhatsApp.
6. LINK OFICIAL: Proporciona siempre https://despiertatuvoz.com si el usuario pregunta por el sitio principal.`,

    web_assistant: `Eres el Asistente Web de Despierta tu Voz. Tu función es informar sobre el proyecto usando ÚNICAMENTE la [BASE DE CONOCIMIENTO] proporcionada.

REGLAS ESTRICTAS:
1. NUNCA inventes información. Si no está en la BASE DE CONOCIMIENTO, di que no tienes esa información.
2. El creador y mentor es FERNANDO MARTÍNEZ LLARENA. No menciones ningún otro nombre.
3. No des consejos técnicos de voz (redirige a la App para eso).
4. Tono: Cálido, profesional y acogedor.
5. Objetivo: Despertar interés en la App o la mentoría.
6. Si preguntan sobre el creador, menciona a Fernando Martínez Llarena y su experiencia de 30 años.`
};

module.exports = async function handler(req, res) {
    // SOPORTE CORS
    res.setHeader('Access-Control-Allow-Credentials', true).setHeader('Access-Control-Allow-Origin', '*').setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT').setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    const { stream } = req.body;

    // Timeout global
    const globalTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("GlobalTimeout")), 290000);
    });

    try {
        if (stream) {
            // Configurar cabeceras de streaming
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');
            await processChat(req, res);
        } else {
            const result = await Promise.race([processChat(req), globalTimeout]);
            return res.status(200).json(result);
        }
    } catch (error) {
        console.error("DEBUG ERR [chat.js]:", error);
        if (res.writableEnded) return;

        const isTimeout = error.message === "GlobalTimeout";
        const status = isTimeout ? 504 : 500;
        const msg = isTimeout ? "¡Vaya! La respuesta está tardando más de lo habitual... ¿Podrías intentar algo más breve?" : "Error técnico temporal.";

        if (stream) {
            res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
            res.end();
        } else {
            return res.status(status).json({ error: msg, details: error.message });
        }
    }
};

async function processChat(req, res = null) {
    let { intent, message, history = [], userId, mentorPassword = "", blogLibrary = [], canRecommend = false, stream = false } = req.body;
    if (intent === 'warmup') return { text: "OK" };
    if (!intent || !SYSTEM_PROMPTS[intent]) throw new Error("Intento no válido");

    let context = "";

    // OPTIMIZACIÓN INSPIRACIÓN: No cargar historial pesado
    const isInspiracion = intent === 'inspiracion_dia';

    if (userId && (intent === 'mentor_chat' || intent === 'mentor_briefing' || intent === 'alchemy_analysis' || intent === 'mentor_advisor' || isInspiracion)) {
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        // Carga de datos base
        const { data: perfil } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle();
        const userTier = perfil?.subscription_tier || 'free';
        const hasPremiumMemory = userTier === 'pro' || userTier === 'premium';

        if (perfil) {
            context += `\n--- SITUACIÓN ACTUAL ---\n- Nombre: ${perfil.nombre}\n- Último Estado: ${perfil.ultimo_resumen || 'Iniciando'}\n`;
            if (!isInspiracion) {
                context += `- Historia: ${perfil.historia_vocal}\n- Nivel: ${perfil.nivel_alquimia}/10\n`;
            }
        }

        // Memoria de Crónicas (Solo si no es inspiración y tiene premium)
        if (hasPremiumMemory && !isInspiracion) {
            const { data: cronicas } = await supabase.from('mensajes')
                .select('texto, created_at')
                .eq('alumno', userId)
                .eq('emisor', 'resumen_diario')
                .order('created_at', { ascending: false })
                .limit(3); // Inyectamos las últimas 3 crónicas como "nodos de memoria"

            if (cronicas?.length > 0) {
                context += `\n--- MEMORIA RECIENTE (Crónicas) ---\n`;
                cronicas.reverse().forEach(c => {
                    context += `[${new Date(c.created_at).toLocaleDateString()}] ${c.texto}\n`;
                });
            }
        }
    }

    const promptFinal = context ? `CONTEXTO:\n${context}\n\nMENSAJE:\n${message}` : message;

    // --- GEMINI STREAMING (PRIORIDAD) ---
    if (process.env.GEMINI_API_KEY) {
        try {
            const endpoint = stream ? 'streamGenerateContent' : 'generateContent';
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:${endpoint}?key=${process.env.GEMINI_API_KEY}${stream ? '&alt=sse' : ''}`;

            const requestBody = {
                contents: [
                    ...formatHistoryForGeminiREST(history),
                    { role: "user", parts: [{ text: promptFinal }] }
                ],
                systemInstruction: { parts: [{ text: SYSTEM_PROMPTS[intent] }] }
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) throw new Error(`Gemini Error ${response.status}`);

            if (stream && res) {
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
                                const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                                if (text) {
                                    fullText += text;
                                    res.write(`data: ${JSON.stringify({ text: text })}\n\n`);
                                }
                            } catch (e) { }
                        }
                    }
                }
                res.end();
                return;
            } else {
                const data = await response.json();
                // Para requests no-stream, la respuesta es directa
                const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
                return { text: text, info: "Gemini 2.0 Flash" };
            }
        } catch (e) {
            console.error("⛔ FALLO GEMINI:", e.message);
            if (!res) throw e;
        }
    }

    // Fallback normal si no hay stream o falla Gemini
    throw new Error("Error de conexión con la IA.");
}

function formatHistoryForGeminiREST(history) {
    if (!Array.isArray(history)) return [];
    let sanitized = [];
    let lastRole = null;

    history.filter(h => h?.parts?.[0]?.text).forEach(h => {
        const role = h.role === 'model' ? 'model' : 'user';
        if (role !== lastRole) {
            sanitized.push({ role, parts: [{ text: h.parts[0].text }] });
            lastRole = role;
        }
    });

    // Ventana inteligente: últimos 10 mensajes (asegurando que el último no sea del modelo si viene después de otro mensaje del modelo)
    while (sanitized.length > 10) sanitized.shift();

    // Gemini a veces falla si el historial termina en 'model' y enviamos otro 'user' (rraro, pero mejor asegurar)
    // En realidad, Gemini REST requiere que el último mensaje de 'contents' sea el que el modelo DEBE responder.
    // Nosotros estamos añadiendo el mensaje actual DESPUÉS de este historial.
    return sanitized;
}

