const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { priceId: planType, userId, userEmail } = req.body;

        if (!planType || !userId) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (planType, userId)' });
        }

        // Mapeamos el slug del plan al Price ID real
        let stripePriceId = "";
        let mode = "subscription";

        if (planType === 'pro') {
            stripePriceId = process.env.STRIPE_PRICE_PRO;
        } else if (planType === 'premium') {
            stripePriceId = process.env.STRIPE_PRICE_PREMIUM;
        } else if (planType === 'extra_30_pro') {
            stripePriceId = "price_1SnwBnHys1jlC29icNTshsmg";
            mode = "payment";
        } else if (planType === 'extra_60_pro') {
            stripePriceId = "price_1SnwA8Hys1jlC29iNUeDFTok";
            mode = "payment";
        } else if (planType === 'extra_30_premium') {
            stripePriceId = "price_1Snw2vHys1jlC29iPQEhHlVF";
            mode = "payment";
        } else if (planType === 'extra_60_premium') {
            stripePriceId = "price_1Snw1WHys1jlC29ilCZ0A5NK";
            mode = "payment";
        }

        if (!stripePriceId) {
            return res.status(400).json({ error: 'ID de precio no configurado para este tipo de sesión/plan' });
        }

        // Creamos la sesión de Checkout
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price: stripePriceId,
                    quantity: 1,
                },
            ],
            mode: mode,
            allow_promotion_codes: true, // Permitir códigos de descuento
            success_url: `${req.headers.origin}/index.html?session_id={CHECKOUT_SESSION_ID}&payment=success`,
            cancel_url: `${req.headers.origin}/landing.html?payment=cancel`,
            customer_email: userEmail,
            client_reference_id: userId, // Importante para el webhook
            metadata: {
                userId: userId,
                planType: planType,
                isExtra: (mode === 'payment' ? 'true' : 'false')
            }
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Error creando sesión de Stripe:', err);
        res.status(500).json({ error: err.message });
    }
}
