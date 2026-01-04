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
    // Usamos el modelo solicitado: Gemini 3 Flash Preview
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

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
      console.error("Error del modelo Gemini:", modelError);
      // Si el error detectado por Google es sobre seguridad, damos un mensaje claro
      if (modelError.message.includes("API_KEY_INVALID") || modelError.message.includes("compromised") || modelError.message.includes("403")) {
        throw new Error("CLAVE BLOQUEADA O SOSPECHOSA: Google ha detectado problemas con tu llave. Debes crear una nueva en AI Studio con una cuenta diferente si es necesario.");
      }
      throw modelError;
    }

    return res.status(200).json({ text: textResponse });
  } catch (error) {
    console.error("Error crítico en /api/gemini:", error);
    return res.status(500).json({
      error: error.message,
      details: "Por favor, crea una API Key nueva en aistudio.google.com (preferiblemente con una cuenta de Gmail distinta) y actualízala en Vercel."
    });
  }
}
