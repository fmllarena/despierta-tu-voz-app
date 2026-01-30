const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

const handler = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido');
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Error en la firma del Webhook: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Manejamos el evento de pago completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planType = session.metadata?.planType || 'pro';
        const stripeCustomerId = session.customer;

        console.log(`✅ Pago completado para el usuario: ${userId} (Plan: ${planType})`);

        await supabase
            .from('user_profiles')
            .update({
                subscription_tier: planType,
                stripe_customer_id: stripeCustomerId
            })
            .eq('user_id', userId);
    }

    // Manejamos la cancelación o fallo de pago permanente de la suscripción
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        const stripeCustomerId = subscription.customer;

        console.log(`ℹ️ Suscripción eliminada para el cliente Stripe: ${stripeCustomerId}`);

        // 1. Buscamos al usuario por su ID de Stripe
        const { data: profile, error: searchError } = await supabase
            .from('user_profiles')
            .select('user_id, email, nombre')
            .eq('stripe_customer_id', stripeCustomerId)
            .single();

        if (profile && !searchError) {
            // 2. Bajamos al usuario a plan 'free'
            await supabase
                .from('user_profiles')
                .update({
                    subscription_tier: 'free'
                })
                .eq('user_id', profile.user_id);

            // 3. Disparamos el email de fallo/recuperación (#6)
            // Llamamos a la Edge Function que crearemos ahora
            try {
                await fetch(`${supabaseUrl}/functions/v1/send-failure-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({
                        user: profile
                    })
                });
                console.log(`📩 Email de recuperación enviado a ${profile.email}`);
            } catch (emailErr) {
                console.error('Error disparando email de fallo:', emailErr);
            }
        }
    }

    res.json({ received: true });
};

handler.config = {
    api: {
        bodyParser: false,
    },
};

module.exports = handler;
