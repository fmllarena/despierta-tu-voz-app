const Stripe = require('stripe');

const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || "").trim());

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { priceId: planType, userId, userEmail } = req.body;

        if (!planType || !userId) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (planType, userId)' });
        }

        // Mapeamos el slug del plan al Price ID real (con .trim() por seguridad)
        let stripePriceId = "";
        let mode = "subscription";

        if (planType === 'pro') {
            stripePriceId = (process.env.STRIPE_PRICE_PRO || "").trim();
        } else if (planType === 'premium') {
            stripePriceId = (process.env.STRIPE_PRICE_PREMIUM || "").trim();
        } else if (planType === 'extra_30_pro') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PRO || "").trim();
            mode = "payment";
        } else if (planType === 'extra_60_pro') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PRO || "").trim();
            mode = "payment";
        } else if (planType === 'extra_30_premium') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PREMIUM || "").trim();
            mode = "payment";
        } else if (planType === 'extra_60_premium') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PREMIUM || "").trim();
            mode = "payment";
        }

        if (!stripePriceId) {
            return res.status(400).json({ error: `ID de precio no configurado para el plan: ${planType}` });
        }

        console.log(`🚀 Iniciando checkout con precio: ${stripePriceId} (Key starts with: ${process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.substring(0, 7) : 'NONE'})`);

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
