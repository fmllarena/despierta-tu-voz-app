const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const MODEL = "black-forest-labs/flux-schnell";

module.exports = async (req, res) => {
    if (req.method !== 'POST') return res.status(405).json({ error: "Método no permitido" });

    const { prompt } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "Falta el prompt" });

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "Falta OPENROUTER_API_KEY" });

    try {
        const response = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': req.headers.origin || 'http://localhost:3001',
            },
            body: JSON.stringify({
                model: MODEL,
                messages: [{ role: 'user', content: prompt }],
                n: 1,
            })
        });

        if (!response.ok) {
            const err = await response.text();
            return res.status(response.status).json({ error: `OpenRouter ${response.status}: ${err}` });
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '';
        const match = content.match(/https?:\/\/[^\s)]+/);
        const imageUrl = match ? match[0] : null;

        if (!imageUrl) return res.status(500).json({ error: "No se pudo extraer la URL de la imagen" });

        res.json({ imageUrl, prompt, model: MODEL });
    } catch (e) {
        res.status(500).json({ error: e.message, details: e.toString() });
    }
};
