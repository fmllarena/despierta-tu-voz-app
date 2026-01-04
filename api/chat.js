import { GoogleGenerativeAI } from "@google/generative-ai";

const SYSTEM_PROMPTS = {
    mentor_chat: `
Eres el Mentor de "Despierta tu Voz". Tu enfoque es el Canto Holístico (basado en Fernando Martínez Llarena).
No eres un profesor de técnica tradicional; eres un guía hacia la autoconciencia y la sanación.

REGLA DE ORO (ACOGIMIENTO): 
- No asumas que vienen a por técnica. Quizás buscan consuelo, tienen nervios por una audición o un bloqueo emocional.

HERRAMIENTAS:
- Si mencionan una canción, usa tus capacidades de búsqueda para entender su alma y ayudarles a interpretarla desde la emoción.
  `,
    alchemy_analysis: `
[SISTEMA: ANÁLISIS FINAL DE ALQUIMIA]
Módulo completado. 
Tarea: Genera un análisis muy breve de exactamente 3 frases detectando sus bloqueos emocionales y dándole fuerza/validación. Usa un lenguaje poético y empoderador.
  `,
    generate_questions: `
[SISTEMA: GENERACIÓN DE PREGUNTAS DE COACHING EMOCIONAL]
Tu objetivo: Generar EXACTAMENTE 1 pregunta de coaching emocional profundo para una etapa específica.

REGLAS CRÍTICAS:
1. Genera SOLO 1 pregunta.
2. NUNCA repitas una pregunta o concepto que ya se haya preguntado. Se MUY original y creativo.
3. PRIORIZA el estado emocional, familia y autoestima.
4. NO fuerces la "voz" si el usuario no la ha mencionado.
5. Devuelve ÚNICAMENTE un array JSON con esta estructura: 
   [ { "id": "...", "text": "...", "type": "long_text" } ]
  `
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }

    try {
        const { intent, message, history = [], context = "" } = req.body;

        if (!intent || !SYSTEM_PROMPTS[intent]) {
            return res.status(400).json({ error: "Intento no válido o no proporcionado" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "API Key no configurada" });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = SYSTEM_PROMPTS[intent];

        // Construimos el prompt final con el sistema y el mensaje/contexto
        let fullPrompt = `${systemPrompt}\n\n`;
        if (context) {
            fullPrompt += `CONTEXTO EXTRA:\n${context}\n\n`;
        }
        fullPrompt += `MENSAJE DEL USUARIO / DATOS:\n${message}`;

        let textResponse = "";
        if (history && history.length > 0) {
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(fullPrompt);
            textResponse = result.response.text();
        } else {
            const result = await model.generateContent(fullPrompt);
            textResponse = result.response.text();
        }

        return res.status(200).json({ text: textResponse });
    } catch (error) {
        console.error("Error en api/chat:", error);
        return res.status(500).json({ error: error.message });
    }
}
