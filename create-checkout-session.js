import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { priceId: planType, userId, userEmail } = req.body;

        if (!planType || !userId) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (planType, userId)' });
        }

        // Mapeamos el slug del plan al Price ID real (desde variables de entorno)
        let stripePriceId = "";
        if (planType === 'pro') stripePriceId = process.env.STRIPE_PRICE_PRO;
        else if (planType === 'premium') stripePriceId = process.env.STRIPE_PRICE_PREMIUM;

        if (!stripePriceId) {
            return res.status(400).json({ error: 'ID de precio no configurado para este plan' });
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
            mode: 'subscription', // O 'payment' si fueran pagos únicos
            success_url: `${req.headers.origin}/index.html?session_id={CHECKOUT_SESSION_ID}&payment=success`,
            cancel_url: `${req.headers.origin}/landing.html?payment=cancel`,
            customer_email: userEmail,
            client_reference_id: userId, // Importante para el webhook
            metadata: {
                userId: userId,
                planType: planType // Guardamos si es 'pro' o 'premium'
            }
        });

        return res.status(200).json({ sessionId: session.id, url: session.url });
    } catch (err) {
        console.error('Error creando sesión de Stripe:', err);
        res.status(500).json({ error: err.message });
    }
}
