const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const { readRawBody } = require('./_lib/webhook-security');
const { captureError, withMonitoring } = require('./_lib/monitoring');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const handler = async function (req, res) {
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido');
    }

    // La firma de Stripe se valida sobre el cuerpo crudo (bytes exactos).
    const buf = await readRawBody(req);
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
        captureError(new Error('STRIPE_WEBHOOK_SECRET no configurado'), {
            endpoint: '/api/webhook',
            method: 'POST',
            level: 'fatal'
        });
        return res.status(500).send('Webhook no configurado');
    }

    let event;

    try {
        event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
    } catch (err) {
        console.error(`❌ Error en la firma del Webhook: ${err.message}`);
        captureError(err, {
            endpoint: '/api/webhook',
            method: 'POST',
            level: 'warning',
            tags: { stage: 'signature' }
        });
        // No devolvemos err.message: filtra detalles del secreto/formato.
        return res.status(400).send('Webhook Error: firma no válida');
    }

    // Manejamos el evento de pago completado
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planType = session.metadata?.planType || 'pro';
        const stripeCustomerId = session.customer;

        console.log(`✅ Pago completado para el usuario: ${userId} (Plan: ${planType})`);

        if (!userId) {
            // Sin client_reference_id no hay a quién aplicar el plan:
            // antes esto fallaba en silencio y el cliente pagaba sin recibir acceso.
            captureError(new Error('checkout.session.completed sin client_reference_id'), {
                endpoint: '/api/webhook',
                method: 'POST',
                extra: { sessionId: session.id, customer: stripeCustomerId }
            });
        } else {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    subscription_tier: planType,
                    stripe_customer_id: stripeCustomerId
                })
                .eq('user_id', userId);

            if (updateError) {
                captureError(updateError, {
                    endpoint: '/api/webhook',
                    method: 'POST',
                    userId,
                    extra: { eventType: event.type, planType }
                });
                // 500 → Stripe reintenta el evento más tarde.
                return res.status(500).json({ error: 'No se pudo aplicar el plan' });
            }
        }
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

        if (searchError || !profile) {
            // Antes: si no había perfil, el usuario seguía como premium para siempre.
            captureError(
                searchError || new Error('Suscripción eliminada sin perfil asociado'),
                {
                    endpoint: '/api/webhook',
                    method: 'POST',
                    extra: { eventType: event.type, stripeCustomerId }
                }
            );
        } else {
            // 2. Bajamos al usuario a plan 'free'
            const { error: downgradeError } = await supabase
                .from('user_profiles')
                .update({
                    subscription_tier: 'free'
                })
                .eq('user_id', profile.user_id);

            if (downgradeError) {
                captureError(downgradeError, {
                    endpoint: '/api/webhook',
                    method: 'POST',
                    userId: profile.user_id,
                    extra: { eventType: event.type, stage: 'downgrade' }
                });
                return res.status(500).json({ error: 'No se pudo actualizar la suscripción' });
            }

            // 3. Disparamos el email de fallo/recuperación (#6)
            try {
                const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-failure-email`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({ user: profile })
                });
                if (!emailRes.ok) {
                    throw new Error(`Edge Function respondió ${emailRes.status}`);
                }
                console.log(`📩 Email de recuperación enviado a ${profile.email}`);
            } catch (emailErr) {
                // El email es secundario: se monitoriza pero no se reintenta el webhook,
                // porque el cambio de plan ya se aplicó correctamente.
                captureError(emailErr, {
                    endpoint: '/api/webhook',
                    method: 'POST',
                    userId: profile.user_id,
                    level: 'warning',
                    extra: { stage: 'failure_email' }
                });
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

module.exports = withMonitoring('/api/webhook', handler);

// Vercel lee `bodyParser` por ANÁLISIS ESTÁTICO del fichero, buscando este
// patrón literal. Sin él, Stripe recibe el cuerpo ya parseado y
// `constructEvent` falla siempre.
module.exports.config = {
    api: {
        bodyParser: false
    }
};
