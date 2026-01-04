import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  // Manejo de CORS manual si fuera necesario (opcional en Vercel api/)
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Si req.body no está parseado, lo parseamos manualmente
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (e) {
        // No es JSON, seguimos
      }
    }

    // Fallback: Si sigue sin haber body (Stream), lo leemos
    if (!body || Object.keys(body).length === 0) {
      body = await new Promise((resolve, reject) => {
        let chunkStr = "";
        req.on("data", (chunk) => (chunkStr += chunk));
        req.on("end", () => {
          try {
            resolve(chunkStr ? JSON.parse(chunkStr) : {});
          } catch (e) {
            reject(new Error("Error parseando JSON del body"));
          }
        });
        req.on("error", (err) => reject(err));
      });
    }

    const { prompt, history = [] } = body;

    if (!prompt) {
      return res.status(400).json({ error: "Falta el prompt en la petición" });
    }

    if (!process.env.GEMINI_API_KEY) {
      console.error("CRÍTICO: GEMINI_API_KEY no configurada en Vercel.");
      return res.status(500).json({ error: "La API Key no está configurada en el servidor de Vercel (Environment Variables)." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Probamos con gemini-1.5-flash-latest que suele ser más resiliente en despliegues serverless
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    let textResponse = "";

    try {
      if (history && history.length > 0) {
        const chat = model.startChat({ history });
        const result = await chat.sendMessage(prompt);
        textResponse = result.response.text();
      } else {
        const result = await model.generateContent(prompt);
        textResponse = result.response.text();
      }
    } catch (modelError) {
      console.error("Error específico del modelo:", modelError);

      // DIAGNÓSTICO: Listar modelos disponibles si fallan los principales
      let availableModels = [];
      try {
        const listResult = await genAI.listModels();
        availableModels = listResult.models.map(m => m.name);
      } catch (listErr) {
        availableModels = [`No se pudieron listar: ${listErr.message}`];
      }

      // Si falla, intentamos con gemini-1.5-flash (sin -latest) como fallback inmediato
      try {
        const backupModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await backupModel.generateContent(prompt);
        textResponse = result.response.text();
      } catch (backupErr) {
        throw new Error(`Error en cascada. Modelos intentados fallaron. Modelos disponibles en tu API Key: ${availableModels.join(", ")}. Error original: ${modelError.message}`);
      }
    }

    return res.status(200).json({ text: textResponse });
  } catch (error) {
    console.error("Error detallado en /api/gemini:", error);
    return res.status(500).json({
      error: `Error interno de servidor: ${error.message}`,
      details: error.stack
    });
  }
}
