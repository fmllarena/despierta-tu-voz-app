// El servidor Express de abajo se encargará de todo.

const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const Stripe = require('stripe');
require('dotenv').config();

const app = express();
const port = 3001;

app.use(cors());

// Necesitamos manejar el webhook antes del express.json()
app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    console.log("🔔 Webhook recibido localmente.");
    res.json({ received: true });
});

app.use(express.json());

// Servir archivos estáticos
app.use(express.static('./'));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/api/chat", async (req, res) => {
    try {
        const { intent, message, history = [], context = "", subscription_tier = 'free' } = req.body;
        // Usamos 2.0-flash por estabilidad en 2026
        const model = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: process.env.SYSTEM_PROMPTS?.[intent] || "" // Si estuviera en env, pero aquí lo simplificamos
        });

        const prompt = context ? `CONTEXTO EXTRA:\n${context}\n\nMENSAJE:\n${message}` : message;

        if (history && history.length > 0) {
            const chat = model.startChat({ history });
            const result = await chat.sendMessage(prompt);
            res.json({ text: result.response.text() });
        } else {
            const result = await model.generateContent(prompt);
            res.json({ text: result.response.text() });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/redeem-promo", async (req, res) => {
    try {
        const { code, userId } = req.body;
        const VALID_CODES = ['ALQUIMIA2026', 'PROMO2026', 'FERNANDO2026'];

        if (!code || !userId) {
            return res.status(400).json({ error: 'Faltan datos' });
        }

        if (!VALID_CODES.includes(code.toUpperCase())) {
            return res.status(400).json({ error: 'Código no válido' });
        }

        // Importamos Supabase aquí o usamos una instancia global
        const { createClient } = require('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

        const { error } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: 'pro',
                mentor_notes: `Promo ${code} canjeada localmente`
            })
            .eq('user_id', userId);

        if (error) throw error;
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/create-checkout-session", async (req, res) => {
    try {
        const { priceId: planType, userId, userEmail } = req.body;
        let stripePriceId = (planType === 'pro') ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_PREMIUM;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: stripePriceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `http://localhost:${port}/index.html?payment=success`,
            cancel_url: `http://localhost:${port}/landing.html?payment=cancel`,
            customer_email: userEmail,
            client_reference_id: userId,
        });

        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/config", (req, res) => {
    res.json({
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY
    });
});

app.listen(port, () => {
    console.log(`🚀 Servidor de pruebas listo en http://localhost:${port}`);
    console.log(`Abre este enlace en tu navegador para usar la app.`);
});
