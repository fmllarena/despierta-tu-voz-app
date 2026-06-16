// api/payments.js
// POST /api/payments  con body.type === 'checkout'       → crea Stripe Checkout Session
// POST /api/payments  con body.type === 'payment-intent' → crea Stripe Payment Intent

const Stripe = require('stripe');
const stripe = new Stripe((process.env.STRIPE_SECRET_KEY || '').trim());

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido' });
    }

    const { type } = req.body;

    // ── Checkout Session ─────────────────────────────────────────────────────
    if (type === 'checkout') {
        try {
            const origin = req.headers.origin || `https://${req.headers.host}` || 'https://app.despiertatuvoz.com';
            const { priceId: planType, userId, userEmail } = req.body;

            if (!planType || !userId) {
                return res.status(400).json({ error: 'Faltan datos obligatorios (planType, userId)' });
            }

            let stripePriceId = '';
            let mode = 'subscription';

            if (planType === 'pro') {
                stripePriceId = (process.env.STRIPE_PRICE_PRO || '').trim();
            } else if (planType === 'premium') {
                stripePriceId = (process.env.STRIPE_PRICE_PREMIUM || '').trim();
            } else if (planType === 'extra_30_pro') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PRO || '').trim();
                mode = 'payment';
            } else if (planType === 'extra_60_pro') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PRO || '').trim();
                mode = 'payment';
            } else if (planType === 'extra_30_premium') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PREMIUM || '').trim();
                mode = 'payment';
            } else if (planType === 'extra_60_premium') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PREMIUM || '').trim();
                mode = 'payment';
            }

            if (!stripePriceId) {
                return res.status(400).json({ error: `ID de precio no configurado para el plan: ${planType}` });
            }

            console.log(`Iniciando checkout con precio: ${stripePriceId}`);

            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: [{ price: stripePriceId, quantity: 1 }],
                mode,
                allow_promotion_codes: true,
                success_url: `${origin}/index.html?session_id={CHECKOUT_SESSION_ID}&payment=success&plan=${planType}`,
                cancel_url: `${origin}/landing.html?payment=cancel`,
                customer_email: userEmail,
                client_reference_id: userId,
                metadata: {
                    userId,
                    planType,
                    isExtra: mode === 'payment' ? 'true' : 'false'
                }
            });

            return res.status(200).json({ sessionId: session.id, url: session.url });

        } catch (err) {
            console.error('Error creando sesión de Stripe:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    // ── Payment Intent ───────────────────────────────────────────────────────
    if (type === 'payment-intent') {
        try {
            const { planType, userId, userEmail } = req.body;

            if (!planType || !userId) {
                return res.status(400).json({ error: 'Faltan datos obligatorios (planType, userId)' });
            }

            let stripePriceId = '';
            if (planType === 'extra_30_pro') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PRO || '').trim();
            } else if (planType === 'extra_60_pro') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PRO || '').trim();
            } else if (planType === 'extra_30_premium') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_30_PREMIUM || '').trim();
            } else if (planType === 'extra_60_premium') {
                stripePriceId = (process.env.STRIPE_PRICE_EXTRA_60_PREMIUM || '').trim();
            }

            if (!stripePriceId) {
                return res.status(400).json({ error: `ID de precio no configurado o no soportado: ${planType}` });
            }

            const price = await stripe.prices.retrieve(stripePriceId);

            const paymentIntent = await stripe.paymentIntents.create({
                amount: price.unit_amount,
                currency: price.currency,
                automatic_payment_methods: { enabled: true },
                receipt_email: userEmail,
                metadata: { userId, planType, isExtra: 'true' }
            });

            let description = 'Sesión Extra de Alquimia Vocal';
            if (planType === 'extra_30_pro' || planType === 'extra_30_premium') description = 'Sesión Extra (30 minutos)';
            if (planType === 'extra_60_pro' || planType === 'extra_60_premium') description = 'Sesión Extra (60 minutos)';

            return res.status(200).json({
                clientSecret: paymentIntent.client_secret,
                amount: price.unit_amount,
                currency: price.currency,
                description
            });

        } catch (err) {
            console.error('Error creando Payment Intent:', err);
            return res.status(500).json({ error: err.message });
        }
    }

    return res.status(400).json({ error: 'Parámetro "type" requerido: "checkout" o "payment-intent"' });
};
