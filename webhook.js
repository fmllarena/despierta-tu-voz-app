import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const config = {
    api: {
        bodyParser: false, // Stripe necesita el body "raw" para verificar la firma
    },
};

async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
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
        const planType = session.metadata?.planType || 'pro'; // Por defecto 'pro' si no viene
        const stripeCustomerId = session.customer;

        console.log(`✅ Pago completado para el usuario: ${userId} (Plan: ${planType})`);

        // Actualizamos el perfil del usuario en Supabase
        const { error } = await supabase
            .from('user_profiles')
            .update({
                subscription_tier: planType,
                stripe_customer_id: stripeCustomerId,
                updated_at: new Date()
            })
            .eq('user_id', userId);

        if (error) {
            console.error('Error actualizando Supabase:', error);
            return res.status(500).json({ error: 'Error actualizando base de datos' });
        }
    }

    res.json({ received: true });
}
