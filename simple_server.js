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
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        let adjustedHistory = history;
        if (subscription_tier === 'free' && intent === 'mentor_chat') {
            adjustedHistory = [];
        }

        const prompt = context ? `${context}\n\n${message}` : message;

        if (adjustedHistory && adjustedHistory.length > 0) {
            const chat = model.startChat({ history: adjustedHistory });
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
