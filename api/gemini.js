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
      return res.status(500).json({ error: "La API Key no está configurada en el servidor." });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Cambiamos a gemini-pro para máxima compatibilidad con llaves de API antiguas o restricciones regionales
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    let textResponse = "";

    if (history && history.length > 0) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      textResponse = result.response.text();
    } else {
      const result = await model.generateContent(prompt);
      textResponse = result.response.text();
    }

    return res.status(200).json({ text: textResponse });
  } catch (error) {
    console.error("Error detallado en /api/gemini:", error);
    return res.status(500).json({ error: `Error interno: ${error.message}` });
  }
}
