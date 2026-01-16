import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPTS = {
    // ... (mantenemos los mismos prompts)
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
    alchemy_analysis: `...`, // (abreviado por brevedad, el original se mantiene)
    generate_questions: `...`, // (idéntico al original)
    identify_limiting_belief: `...`, // (idéntico al original)
    generate_action_plan: `...`, // (idéntico al original)
    mentor_briefing: `...` // (idéntico al original)
};

// Re-hidratamos el objeto completo para evitar errores de referencia
SYSTEM_PROMPTS.alchemy_analysis = `[SISTEMA: ANÁLISIS FINAL DE ALQUIMIA]
Has completado un módulo del viaje. 

TAREA: Genera una reflexión profunda y poética del Mentor.
REGLA DE ORO: Empiezas DIRECTAMENTE con el mensaje poético. NUNCA digas frases como "Tras analizar el contexto...", "Se detecta que...", "Basado en tus respuestas...", etc. El usuario debe sentir que le hablas directamente desde tu sabiduría, no que eres un procesador de datos.

1. Identifica el módulo actual por las respuestas.
2. Para el Módulo 5 (Alquimia Final): No te limites a un texto fijo. Analiza su viaje, menciona hilos conductores que has visto en sus respuestas y expande su visión. 
3. Para Módulo 3 (Personaje): Analiza cómo su máscara de [Nombre del Rol] le ha servido y cómo ahora puede soltarla.
4. Para Módulo 4: Valida la vulnerabilidad mostrada en las cartas.
5. Usa un tono acogedor y profundamente humano. Extensión recomendada: 80-120 palabras.`;

SYSTEM_PROMPTS.generate_questions = `[SISTEMA: GENERACIÓN DE PREGUNTAS DE COACHING EMOCIONAL]
Tu objetivo: Generar EXACTAMENTE 1 pregunta de coaching emocional profundo para una etapa específica.

REGLAS CRÍTICAS:
1. Genera SOLO 1 pregunta.
2. NUNCA repitas una pregunta o concepto que ya se haya preguntado. Se MUY original y creativo.
3. PRIORIZA el estado emocional, familia y autoestima.
4. Contesta con 4 párrafos como máximo.
5. NO fuerces la "voz" si el usuario no la ha mencionado.
    [ { "id": "...", "text": "...", "type": "long_text" } ]`;

SYSTEM_PROMPTS.identify_limiting_belief = `[SISTEMA: EXTRACCIÓN DE CREENCIAS]
Analiza el historial del usuario que se te proporciona en el CONTEXTO. 
TAREA: Identifica la creencia limitante principal que ha frenado su voz durante este viaje (miedo al juicio, perfeccionismo, invisibilidad, etc.) pero exponla con suavidad y solo algunas veces, no saques el tema constantemente.
REQUISITO: Devuelve SOLO la creencia redactada en primera persona, de forma breve y potente (máx 15 palabras).
Ejemplo: "Mi voz no es lo suficientemente buena para ser escuchada."`;

SYSTEM_PROMPTS.generate_action_plan = `[SISTEMA: GENERACIÓN DE PLAN DE ACCIÓN MENTOR]
Analiza el historial del usuario en el CONTEXTO.
TAREA: Genera un plan de acción personalizado para su desarrollo vocal y bienestar.
REQUISITOS: 
1. Genera 3 Objetivos SMART (Específicos, Medibles, Alcanzables, Relevantes, Temporales).
2. Genera una Rutina de Autocuidado (3 pasos prácticos diarios).
FORMATO: Devuelve ÚNICAMENTE un JSON con esta estructura:
{
  "smart_goals": "...",
  "self_care_routine": "..."
}`;

SYSTEM_PROMPTS.mentor_briefing = `[SISTEMA: INFORME SINTETIZADO PARA EL MENTOR]
Eres un asistente experto en coaching vocal y emocional. 
TAREA: Analiza TODO el historial del alumno (datos del viaje y mensajes de chat) y genera un briefing estratégico para el mentor (Fer) antes de su reunión.

ESTRUCTURA DEL INFORME:
1. PERFIL ESENCIAL: Nombre, etapa actual del viaje y "vibración" general (ánimo detectado).
2. ANOTACIONES DEL MENTOR: Si existen notas previas de Fer en el contexto, sintetízalas (son fundamentales).
3. HILO CONDUCTOR: ¿Cuál es el tema recurrente en sus bloqueos o descubrimientos?
4. HITOS CLAVE: Resumen de lo más potente que ha dicho en las Bitácoras (Módulos 1-5).
5. ÁREAS DE ATENCIÓN: ¿Qué puntos crees que Fer debería tocar en la reunión para desbloquear al alumno?
6. RECOMENDACIÓN TÉCNICA/EMOCIONAL: Un consejo específico para que el mentor use hoy.

TONO: Profesional, perspicaz y directo. Máximo 300 palabras.`;

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
        const { intent, message, history = [], userId, originPost, originCat, canRecommend, blogLibrary = [], mentorPassword = "" } = req.body;

        if (!intent || !SYSTEM_PROMPTS[intent]) {
            return res.status(400).json({ error: "Intento no válido" });
        }

        // --- SEGURIDAD EXTRA PARA EL BRIEFING ---
        if (intent === 'mentor_briefing') {
            const secretPass = process.env.MENTOR_PASSWORD || 'Alquimia2026';
            if (mentorPassword !== secretPass) {
                return res.status(401).json({ error: "Acceso denegado." });
            }
        }

        let context = "";

        // --- OBTENCIÓN DE CONTEXTO EN EL SERVIDOR (SEGURIDAD) ---
        if (userId && (intent === 'mentor_chat' || intent === 'mentor_briefing' || intent === 'alchemy_analysis')) {
            const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

            const [{ data: perfil }, { data: viaje }] = await Promise.all([
                supabase.from('user_profiles').select('*').eq('user_id', userId).single(),
                supabase.from('user_coaching_data').select('*').eq('user_id', userId).single()
            ]);

            if (perfil) {
                context = `\n--- INFO PRIVADA DEL ALUMNO ---\n`;
                if (originPost) {
                    context += `\n--- CONTEXTO DE ENTRADA ---\n- El alumno viene de: "${originPost}"\n- Categoría: ${originCat}\n- Acción: Salúdale conectando con el post.\n`;
                }

                context += `- Historia Vocal: ${perfil.historia_vocal || 'N/A'}\n`;
                context += `- Creencias: ${perfil.creencias || 'N/A'}\n`;
                context += `- Alquimia: ${perfil.nivel_alquimia || 1}/10\n`;
                context += `- Viaje Completado: ${perfil.last_hito_completed >= 5 ? 'SÍ' : 'NO'}\n`;
                context += `- NOTAS DE FER: ${perfil.mentor_notes || 'Ninguna'}\n`;

                // Estilo
                const length = perfil.mentor_length ?? 0.5;
                const focus = perfil.mentor_focus ?? 0.5;
                const personality = perfil.mentor_personality ?? 0.5;

                context += `\n--- ESTILO REQUERIDO ---\n`;
                if (length < 0.3) context += `- Sé muy BREVE.\n`;
                else if (length > 0.7) context += `- Sé muy DETALLADO.\n`;

                if (focus < 0.3) context += `- Enfoque TÉCNICO.\n`;
                else if (focus > 0.7) context += `- Enfoque EMOCIONAL.\n`;

                if (personality > 0.7) context += `- Tono MOTIVADOR.\n`;
                else if (personality < 0.3) context += `- Tono NEUTRO.\n`;

                context += `- Idioma: ${perfil.mentor_language || 'es'}.\n`;

                // Artículos
                if (canRecommend && blogLibrary.length > 0) {
                    context += `\n--- BIBLIOTECA DE FERNANDO (SOLO PARA TU REFERENCIA) ---\n`;
                    context += `Instrucción: NUNCA muestres esta lista al usuario. Úsala solo para elegir UN artículo si es pertinente y NUNCA en el primer mensaje de la sesión.\n`;
                    const titles = blogLibrary.map(post => `- ${post.title}: ${post.url}`).join('\n');
                    context += `ARTÍCULOS DISPONIBLES:\n${titles}\n`;
                }
            }

            if (viaje) {
                context += `\n--- DATOS DEL VIAJE ---\n- M1: ${JSON.stringify(viaje.linea_vida_hitos?.respuestas || {})}\n- M2: ${JSON.stringify(viaje.herencia_raices?.respuestas || {})}\n`;
            }
        }

        // --- LLAMADA A GEMINI ---
        if (!process.env.GEMINI_API_KEY) return res.status(500).json({ error: "Falta API Key" });

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelConfig = { systemInstruction: SYSTEM_PROMPTS[intent] };
        const models = [
            "gemini-3-flash-preview",
            "gemini-3-flash",
            "gemini-2.0-flash",
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-1.5-pro-latest"
        ];
        let errors = [];

        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ ...modelConfig, model: modelName });
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 20000));
                const promptFinal = context ? `CONTEXTO EXTRA:\n${context}\n\nMENSAJE:\n${message}` : message;

                let adjustedHistory = history.filter(h => h.parts && h.parts.length > 0 && h.parts[0].text?.trim() !== "");

                let result;
                if (adjustedHistory.length > 0) {
                    const chat = model.startChat({ history: adjustedHistory });
                    result = await Promise.race([chat.sendMessage(promptFinal), timeoutPromise]);
                } else {
                    result = await Promise.race([model.generateContent(promptFinal), timeoutPromise]);
                }

                return res.status(200).json({ text: result.response.text() });
            } catch (e) {
                errors.push(`${modelName}: ${e.message}`);
            }
        }

        return res.status(500).json({ error: "Error de conexión con IA", details: errors.join(" | ") });

    } catch (error) {
        console.error("Error crítico:", error);
        return res.status(500).json({ error: "Error en el servidor", details: error.message });
    }
}
