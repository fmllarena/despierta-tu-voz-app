const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 3000;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.wav': 'audio/wav',
    '.mp4': 'video/mp4',
    '.woff': 'application/font-woff',
    '.ttf': 'application/font-ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'application/font-otf',
    '.wasm': 'application/wasm'
};

http.createServer(function (request, response) {
    const parsedUrl = new URL(request.url, `http://${request.headers.host}`);
    let filePath = '.' + parsedUrl.pathname;

    console.log('request ', filePath);

    if (filePath == './') {
        filePath = './index.html';
    }

    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, function (error, content) {
        if (error) {
            if (error.code == 'ENOENT') {
                fs.readFile('./404.html', function (error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
                response.end();
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

}).listen(port);

console.log(`Server running at http://localhost:${port}/`);

import express from "express";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Stripe from 'stripe';
import 'dotenv/config';

const app = express();
app.use(cors());

// Necesitamos manejar el webhook antes del express.json()
app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    // Para simplificar en local, solo imprimimos que llegó el webhook
    // El procesamiento real ocurre en Vercel con la clave secreta
    console.log("🔔 Webhook recibido localmente.");
    res.json({ received: true });
});

app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/api/chat", async (req, res) => {
    try {
        const { intent, message, history = [], context = "", subscription_tier = 'free' } = req.body;
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash" });

        // Lógica de historial restringido para usuarios free
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
}
);

app.post("/api/create-checkout-session", async (req, res) => {
    try {
        const { priceId: planType, userId, userEmail } = req.body;

        // Mapeo simple para local (usa tus IDs reales de Stripe en .env)
        let stripePriceId = (planType === 'pro') ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_PREMIUM;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{ price: stripePriceId, quantity: 1 }],
            mode: 'subscription',
            success_url: `http://localhost:3000/index.html?payment=success`,
            cancel_url: `http://localhost:3000/landing.html?payment=cancel`,
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

// Servir archivos estáticos
app.use(express.static('./'));

app.listen(3001, () => console.log("Servidor de pruebas listo en http://localhost:3001"));
