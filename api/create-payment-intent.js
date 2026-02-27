const Stripe = require('stripe');
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || "").trim());

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    try {
        const { planType, userId, userEmail } = req.body;

        if (!planType || !userId) {
            return res.status(400).json({ error: 'Faltan datos obligatorios (planType, userId)' });
        }

        // Mapeamos el slug del plan al Price ID real
        let stripePriceId = "";
        if (planType === 'extra_30_pro') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PRO || "").trim();
        } else if (planType === 'extra_60_pro') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PRO || "").trim();
        } else if (planType === 'extra_30_premium') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PREMIUM || "").trim();
        } else if (planType === 'extra_60_premium') {
            stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PREMIUM || "").trim();
        }

        // Si es un upgrade de suscripción, la lógica es diferente con Elements (SetupIntents o PaymentIntents iniciales)
        // Para este MVP nos centramos en sesiones EXTRA (pagos únicos)
        if (!stripePriceId) {
            return res.status(400).json({ error: `ID de precio no configurado o no soportado para In-App: ${planType}` });
        }

        // Obtener el precio para calcular el amount
        const price = await stripe.prices.retrieve(stripePriceId);

        // Crear Payment Intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: price.unit_amount,
            currency: price.currency,
            automatic_payment_methods: { enabled: true },
            receipt_email: userEmail,
            metadata: {
                userId: userId,
                planType: planType,
                isExtra: 'true'
            }
        });

        let description = "Sesión Extra de Alquimia Vocal";
        if (planType === 'extra_30_pro' || planType === 'extra_30_premium') description = "Sesión Extra (30 minutos)";
        if (planType === 'extra_60_pro' || planType === 'extra_60_premium') description = "Sesión Extra (60 minutos)";

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            amount: price.unit_amount,
            currency: price.currency,
            description: description
        });
    } catch (err) {
        console.error('Error creando Payment Intent:', err);
        res.status(500).json({ error: err.message });
    }
};
