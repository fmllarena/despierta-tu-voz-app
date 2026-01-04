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

/**
 * Función para llamar a Gemini con reintentos/fallbacks de modelos
 */
async function callGemini(genAI, modelName, prompt, history) {
    try {
        console.log(`Intentando con modelo: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });

        if (history && history.length > 0) {
            // Validar que el historial empiece por 'user'
            let validHistory = [...history];
            if (validHistory[0].role === 'model') {
                validHistory.shift(); // Quitamos el primer mensaje si es del modelo
            }

            const chat = model.startChat({ history: validHistory });
            const result = await chat.sendMessage(prompt);
            return result.response.text();
        } else {
            const result = await model.generateContent(prompt);
            return result.response.text();
        }
    } catch (e) {
        console.error(`Error con modelo ${modelName}:`, e.message);
        throw e;
    }
}

export default async function handler(req, res) {
    if (req.method === "OPTIONS") return res.status(200).end();
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
        // Lectura robusta del body
        let body = req.body;
        if (!body || Object.keys(body).length === 0) {
            body = await new Promise((resolve) => {
                let chunkStr = "";
                req.on("data", (chunk) => (chunkStr += chunk));
                req.on("end", () => {
                    try { resolve(chunkStr ? JSON.parse(chunkStr) : {}); } catch { resolve({}); }
                });
            });
        }

        const { intent, message, history = [], context = "" } = body;

        if (!intent || !SYSTEM_PROMPTS[intent]) {
            return res.status(400).json({ error: "Intento no válido: " + intent });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Falta GEMINI_API_KEY en variables de entorno." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const systemPrompt = SYSTEM_PROMPTS[intent];

        let fullPrompt = `${systemPrompt}\n\n`;
        if (context) fullPrompt += `CONTEXTO EXTRA:\n${context}\n\n`;
        fullPrompt += `MENSAJE DEL USUARIO / DATOS:\n${message}`;

        let textResponse = "";

        // Lista de modelos a probar en orden de preferencia
        const modelsToTry = ["gemini-3-flash", "gemini-1.5-flash", "gemini-pro"];
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                textResponse = await callGemini(genAI, modelName, fullPrompt, history);
                lastError = null; // Éxito
                break;
            } catch (e) {
                lastError = e;
            }
        }

        if (lastError) {
            return res.status(500).json({
                error: "No se pudo conectar con ningún modelo de Gemini.",
                details: lastError.message
            });
        }

        return res.status(200).json({ text: textResponse });
    } catch (error) {
        console.error("Error crítico:", error);
        return res.status(500).json({ error: error.message });
    }
}
