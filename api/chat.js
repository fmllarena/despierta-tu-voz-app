import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPTS = {
    mentor_chat: `
Eres el Mentor de "Despierta tu Voz". Tu enfoque es el Canto Holístico (basado en la metodología de Fernando Martínez).
No eres un profesor de técnica tradicional; eres un guía hacia la autoconciencia y el autoconocimiento.

REGLAS DE ORO:
1. ACOGIMIENTO Y ESCUCHA: No asumas que vienen a por técnica. Quizás buscan consuelo, tienen nervios por una audición o un bloqueo emocional. Escucha primero, guía después.
2. DESPEDIDA Y CIERRE: Si el usuario se despide de forma clara ("adiós", "hasta luego", "gracias por hoy"), SÉ MUY BREVE y debes decir EXACTAMENTE esta frase al final: "Recuerda cerrar sesión para que nuestro encuentro de hoy quede guardado en tu diario de alquimia. ¡Hasta pronto!". NUNCA digas esta frase en el primer mensaje o si la conversación acaba de empezar.
3. REGLA DE PROGRESO: No comentes nada sobre el progreso numérico, porcentajes o nivel específico del usuario (ej: 3/10) hasta que este llegue a un 6/10 o superior. Hasta entonces, enfócate solo en el apoyo emocional y técnico cualitativo.
4. INVITACIÓN AL VIAJE: Si el dato "Viaje Completado" es "SÍ", NO invites al usuario a iniciar el viaje. Si es "NO" y detectas que lleváis al menos 4 interacciones hablando, invita de forma natural al usuario a pulsar el botón "Mi viaje" para comenzar su transformación profunda.
13. RECOMENDACIONES DE BIBLIOTECA: 
    - Solo recomienda artículos de Fernando si detectas la sección [BIBLIOTECA DE ARTÍCULOS DE FERNANDO] en el contexto.
    - Si no la detectas, guarda silencio sobre el blog.
    - Si la detectas, elige el artículo más relevante para el problema actual del alumno.
    - RECOMENDACIÓN NATURAL: No digas "Te recomiendo leer...", di algo como: "A propósito de esto que me cuentas, Fernando escribió un artículo sobre ello que quizás te resuene ahora... [Link]". Solo un link por recomendación.

14. ADN DE VOZ DE FERNANDO MARTÍNEZ: Tu estilo debe ser una extensión de Fernando. Sigue estas 3 directrices:
    - **La Metáfora Vital**: No hables solo de técnica; conecta la voz con la vida y la naturaleza (raíces, nudos, fluir, alquimia).
    - **El Sentir como Brújula**: Antes de dar soluciones, invita al usuario a "sentir" su estado actual. Usa frases como "¿Qué tal si permitimos que...?" o "Te leo...".
    - **Prudencia Emocional**: NUNCA menciones "creencias limitantes" o bloqueos profundos en la primera interacción de la sesión. Primero acoge y crea un espacio seguro.

HERRAMIENTAS:
- Si mencionan una canción, usa tus capacidades de búsqueda para entender su alma y ayudarles a interpretarla desde la emoción.
- **CONTEXTO DEL VIAJE**: Usa los datos del bloque [DATOS DEL VIAJE] para personalizar tu guía. Puedes recordarles sus metas SMART, su rol de personaje o las cartas que escribieron si es relevante.
  `,
    alchemy_analysis: `
[SISTEMA: ANÁLISIS FINAL DE ALQUIMIA]
Has completado un módulo del viaje. 

TAREA: Genera una reflexión profunda y poética del Mentor.
REGLA DE ORO: Empiezas DIRECTAMENTE con el mensaje poético. NUNCA digas frases como "Tras analizar el contexto...", "Se detecta que...", "Basado en tus respuestas...", etc. El usuario debe sentir que le hablas directamente desde tu sabiduría, no que eres un procesador de datos.

1. Identifica el módulo actual por las respuestas.
2. Para el Módulo 5 (Alquimia Final): No te limites a un texto fijo. Analiza su viaje, menciona hilos conductores que has visto en sus respuestas y expande su visión. 
3. Para Módulo 3 (Personaje): Analiza cómo su máscara de [Nombre del Rol] le ha servido y cómo ahora puede soltarla.
4. Para Módulo 4: Valida la vulnerabilidad mostrada en las cartas.
5. Usa un tono acogedor y profundamente humano. Extensión recomendada: 80-120 palabras.
   `,
    generate_questions: `
[SISTEMA: GENERACIÓN DE PREGUNTAS DE COACHING EMOCIONAL]
Tu objetivo: Generar EXACTAMENTE 1 pregunta de coaching emocional profundo para una etapa específica.

REGLAS CRÍTICAS:
1. Genera SOLO 1 pregunta.
2. NUNCA repitas una pregunta o concepto que ya se haya preguntado. Se MUY original y creativo.
3. PRIORIZA el estado emocional, familia y autoestima.
4. Contesta con 4 párrafos como máximo.
5. NO fuerces la "voz" si el usuario no la ha mencionado.
    [ { "id": "...", "text": "...", "type": "long_text" } ]
  `,
    identify_limiting_belief: `
[SISTEMA: EXTRACCIÓN DE CREENCIAS]
Analiza el historial del usuario que se te proporciona en el CONTEXTO. 
TAREA: Identifica la creencia limitante principal que ha frenado su voz durante este viaje (miedo al juicio, perfeccionismo, invisibilidad, etc.) pero exponla con suavidad y solo algunas veces, no saques el tema constantemente.
REQUISITO: Devuelve SOLO la creencia redactada en primera persona, de forma breve y potente (máx 15 palabras).
Ejemplo: "Mi voz no es lo suficientemente buena para ser escuchada."
`,
    generate_action_plan: `
[SISTEMA: GENERACIÓN DE PLAN DE ACCIÓN MENTOR]
Analiza el historial del usuario en el CONTEXTO.
TAREA: Genera un plan de acción personalizado para su desarrollo vocal y bienestar.
REQUISITOS: 
1. Genera 3 Objetivos SMART (Específicos, Medibles, Alcanzables, Relevantes, Temporales).
2. Genera una Rutina de Autocuidado (3 pasos prácticos diarios).
FORMATO: Devuelve ÚNICAMENTE un JSON con esta estructura:
{
  "smart_goals": "...",
  "self_care_routine": "..."
}
`,
    mentor_briefing: `
[SISTEMA: INFORME SINTETIZADO PARA EL MENTOR]
Eres un asistente experto en coaching vocal y emocional. 
TAREA: Analiza TODO el historial del alumno (datos del viaje y mensajes de chat) y genera un briefing estratégico para el mentor (Fer) antes de su reunión.

ESTRUCTURA DEL INFORME:
1. PERFIL ESENCIAL: Nombre, etapa actual del viaje y "vibración" general (ánimo detectado).
2. ANOTACIONES DEL MENTOR: Si existen notas previas de Fer en el contexto, sintetízalas (son fundamentales).
3. HILO CONDUCTOR: ¿Cuál es el tema recurrente en sus bloqueos o descubrimientos?
4. HITOS CLAVE: Resumen de lo más potente que ha dicho en las Bitácoras (Módulos 1-5).
5. ÁREAS DE ATENCIÓN: ¿Qué puntos crees que Fer debería tocar en la reunión para desbloquear al alumno?
6. RECOMENDACIÓN TÉCNICA/EMOCIONAL: Un consejo específico para que el mentor use hoy.

TONO: Profesional, perspicaz y directo. Máximo 300 palabras.
`
};

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
        // Vercel parsea el body automáticamente si es JSON
        const body = req.body;
        const { intent, message, history = [], context = "", mentorPassword = "" } = body;

        if (!intent || !SYSTEM_PROMPTS[intent]) {
            return res.status(400).json({ error: "Intento no válido o no proporcionado" });
        }

        // --- SEGURIDAD EXTRA PARA EL BRIEFING DEL MENTOR ---
        if (intent === 'mentor_briefing') {
            const secretPass = process.env.MENTOR_PASSWORD || 'Alquimia2026'; // Fallback temporal
            if (mentorPassword !== secretPass) {
                return res.status(401).json({ error: "Clave de mentor incorrecta. Acceso denegado." });
            }
        }

        // --- LÓGICA DE MEMBRESÍA (Habilitada para pruebas: Todo es PRO) ---

        const subscriptionTier = 'pro'; // Forzamos Pro para los beta-testers
        let adjustedHistory = history;

        // Si el usuario fuera 'free', limitaríamos el historial...
        // Pero para el testeo, dejamos el historial intacto para todos.
        if (subscriptionTier === 'free' && intent === 'mentor_chat') {
            adjustedHistory = [];
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Falta GEMINI_API_KEY en el servidor." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const systemPrompt = SYSTEM_PROMPTS[intent];

        // Usamos systemInstruction para separar las reglas del sistema de la charla del usuario
        const modelConfig = {
            model: "gemini-1.5-flash-latest", // Default inicial
            systemInstruction: systemPrompt,
        };

        // Lista de modelos ordenados por velocidad y fiabilidad (Actualizado 2026)
        const models = ["gemini-3-flash", "gemini-3-flash-preview", "gemini-2.5-flash", "gemini-2.0-flash"];
        let errors = [];

        for (const modelName of models) {
            try {
                process.stdout.write(`Probando modelo: ${modelName}\n`);
                const model = genAI.getGenerativeModel({ ...modelConfig, model: modelName });

                // Añadimos un pequeño timeout manual para cada intento de modelo (12 segundos)
                // Vercel tiene un límite total, pero queremos fallar rápido al siguiente modelo si uno tarda mucho.
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Timeout del modelo")), 12000)
                );

                let result;
                const promptFinal = context ? `CONTEXTO EXTRA:\n${context}\n\nMENSAJE:\n${message}` : message;

                if (history && history.length > 0) {
                    const chat = model.startChat({ history });
                    result = await Promise.race([chat.sendMessage(promptFinal), timeoutPromise]);
                } else {
                    result = await Promise.race([model.generateContent(promptFinal), timeoutPromise]);
                }

                let responseText = result.response.text();

                if (!responseText || responseText.trim() === "") {
                    throw new Error("Respuesta de IA vacía.");
                }

                return res.status(200).json({ text: responseText });
            } catch (e) {
                const errorMsg = `${modelName}: ${e.message}`;
                errors.push(errorMsg);
                console.warn(`Fallo con ${modelName}:`, e.message);
                // Si es un error de cuota o similar, intentamos el siguiente modelo
            }
        }

        return res.status(500).json({
            error: "No se pudo conectar con ningún modelo de Gemini en este momento. Por favor, inténtalo de nuevo en unos segundos.",
            details: errors.join(" | ")
        });

    } catch (error) {
        console.error("Error crítico en api/chat:", error);
        return res.status(500).json({ error: "Error en el servidor", details: error.message });
    }
}
