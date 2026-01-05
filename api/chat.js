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
Has completado un módulo del viaje. 

TAREA:
1. Analiza el contexto para detectar en qué módulo estamos (1: Espejo, 2: Herencia, 3: Personaje, 4: Sanación/Altar).
2. Si es el Módulo 3 (El Personaje), usa este enfoque OBLIGATORIO:
   "Reconocer que has estado usando la máscara de [Nombre del Rol] es el primer paso para quitártela. Este personaje te sirvió en el pasado para protegerte, pero hoy tu voz ya no lo necesita para estar a salvo. En nuestro próximo ejercicio, vamos a cantar desde tu esencia, no desde tu máscara."
   - Personaliza el [Nombre del Rol] con el que el usuario haya elegido.
3. Si es el Módulo 4 (El Altar de las Palabras/Sanación), usa este enfoque OBLIGATORIO:
   "Has hecho un trabajo valiente. Al liberar estas palabras, has ensanchado tu canal vocal. Ese nudo que sentías ahora tiene espacio para convertirse en música. Respira ese espacio nuevo."
   - Valida la catarsis emocional que el usuario acaba de realizar en sus cartas.
4. Si es el Módulo 5 (Alquimia Final y Propósito), usa este enfoque OBLIGATORIO (Despedida Final):
   "Has completado tu Gran Obra. Tu voz ya no es un eco de tus miedos o de tus ancestros, sino el canal de tu propósito. Recuerda: no busques la perfección, busca la conexión. Bienvenido a tu nueva libertad vocal."
   - Celebra el plan de acción y el propósito descubierto.
5. Para otros módulos, genera un análisis breve de exactamente 3 frases detectando sus bloqueos y dando validación poética.
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
    if (req.method !== "POST") return res.status(405).json({ error: "Método no permitido" });

    try {
        // Vercel parsea el body automáticamente si es JSON
        const body = req.body;
        const { intent, message, history = [], context = "" } = body;

        if (!intent || !SYSTEM_PROMPTS[intent]) {
            return res.status(400).json({ error: "Intento no válido o no proporcionado" });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Falta GEMINI_API_KEY en el servidor." });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const systemPrompt = SYSTEM_PROMPTS[intent];

        let fullPrompt = `${systemPrompt}\n\n`;
        if (context) fullPrompt += `CONTEXTO EXTRA:\n${context}\n\n`;
        fullPrompt += `MENSAJE DEL USUARIO / DATOS:\n${message}`;

        // Lista de modelos a probar
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
