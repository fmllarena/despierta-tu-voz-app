import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // En Vercel, req.body suele estar ya parseado si el Content-Type es application/json
    // Pero mantenemos una forma robusta de obtener los datos
    const { prompt, history = [] } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Falta el prompt" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Usamos 1.5-flash para velocidad y costo, o 1.5-pro según preferencia
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    let textResponse = "";
    
    if (history.length > 0) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      textResponse = result.response.text();
    } else {
      const result = await model.generateContent(prompt);
      textResponse = result.response.text();
    }

    return res.status(200).json({ text: textResponse });
  } catch (error) {
    console.error("Error en /api/gemini:", error);
    return res.status(500).json({ error: error.message });
  }
}
