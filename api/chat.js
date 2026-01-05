import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPTS = {
    mentor_chat: `
Eres el Mentor de "Despierta tu Voz". Tu enfoque es el Canto Holístico (basado en Fernando Martínez Llarena).
No eres un profesor de técnica tradicional; eres un guía hacia la autoconciencia y la sanación.

REGLA DE ORO (ACOGIMIENTO): 
- No asumas que vienen a por técnica. Quizás buscan consuelo, tienen nervios por una audición o un bloqueo emocional.

HERRAMIENTAS:
- Si mencionan una canción, usa tus capacidades de búsqueda para entender su alma y ayudarles a interpretarla desde la emoción.
- **CONTEXTO DEL VIAJE**: Si recibes datos en el bloque [DATOS DEL VIAJE "MI VIAJE"], úsalos para personalizar tu guía. Puedes recordarles sus metas SMART, su rol de personaje (Módulo 3) o las cartas que escribieron (Módulo 4). Si preguntan por rutinas, refiérete a su Plan de Acción del Módulo 5.
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
5. Usa un tono místico, acogedor y profundamente humano. Extensión recomendada: 80-120 palabras.
   `,
    generate_questions: `
[SISTEMA: GENERACIÓN DE PREGUNTAS DE COACHING EMOCIONAL]
Tu objetivo: Generar EXACTAMENTE 1 pregunta de coaching emocional profundo para una etapa específica.

REGLAS CRÍTICAS:
1. Genera SOLO 1 pregunta.
2. NUNCA repitas una pregunta o concepto que ya se haya preguntado. Se MUY original y creativo.
3. PRIORIZA el estado emocional, familia y autoestima.
4. NO fuerces la "voz" si el usuario no la ha mencionado.
    [ { "id": "...", "text": "...", "type": "long_text" } ]
  `,
    identify_limiting_belief: `
[SISTEMA: EXTRACCIÓN DE CREENCIAS]
Analiza el historial del usuario que se te proporciona en el CONTEXTO. 
TAREA: Identifica la creencia limitante principal que ha frenado su voz durante este viaje (miedo al juicio, perfeccionismo, invisibilidad, etc.).
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
`
};

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
        // Vercel parsea el body automáticamente si es JSON
        const body = req.body;
        const { intent, message, history = [], context = "" } = body;

        if (!intent || !SYSTEM_PROMPTS[intent]) {
            return res.status(400).json({ error: "Intento no válido o no proporcionado" });
        }

        // --- LÓGICA DE MEMBRESÍA ---
        const subscriptionTier = body.subscription_tier || 'free';
        let adjustedHistory = history;

        // Si el usuario es 'free', limitamos el historial para que no tenga "memoria relacional"
        // Solo dejamos el mensaje actual o un historial mínimo para que el chat Fluya pero no "recuerde" sesiones pasadas.
        if (subscriptionTier === 'free' && intent === 'mentor_chat') {
            adjustedHistory = []; // Limpiamos historial para versión gratuita (sin repositorio)
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Falta GEMINI_API_KEY en el servidor." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const systemPrompt = SYSTEM_PROMPTS[intent];

        let fullPrompt = `${systemPrompt}\n\n`;
        if (context) fullPrompt += `CONTEXTO EXTRA:\n${context}\n\n`;
        fullPrompt += `MENSAJE DEL USUARIO / DATOS:\n${message}`;

        // Lista de modelos priorizando VELOCIDAD y Fiabilidad (Restaurando gemini-3-flash por petición)
        const models = ["gemini-3-flash-preview", "gemini-3-flash", "gemini-1.5-flash", "gemini-2.0-flash-exp"];
        let lastError = "";

        for (const modelName of models) {
            try {
                console.log(`Probando modelo: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });

                let result;
                if (history && history.length > 0) {
                    const chat = model.startChat({ history });
                    result = await chat.sendMessage(fullPrompt);
                } else {
                    result = await model.generateContent(fullPrompt);
                }

                const responseText = result.response.text();
                return res.status(200).json({ text: responseText });
            } catch (e) {
                lastError = `${modelName}: ${e.message}`;
                console.warn(`Fallo con ${modelName}:`, e.message);
            }
        }

        return res.status(500).json({
            error: "No se pudo conectar con ningún modelo de Gemini.",
            details: lastError
        });

    } catch (error) {
        console.error("Error crítico en api/chat:", error);
        return res.status(500).json({ error: "Error en el servidor", details: error.message });
    }
}
