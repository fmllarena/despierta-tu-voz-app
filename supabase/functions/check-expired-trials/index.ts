// Función Edge de Supabase para verificar trials expirados
// Se ejecuta diariamente mediante cron job

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const brevoApiKey = Deno.env.get('BREVO_API_KEY');

        console.log('🔍 Buscando usuarios con trial expirado...');

        // Buscar usuarios con trial expirado que aún son Pro y no tienen pago activo
        const { data: expiredUsers, error: selectError } = await supabaseClient
            .from('user_profiles')
            .select('user_id, email, nombre, trial_end_date, promo_locked_price')
            .eq('subscription_tier', 'pro')
            .lt('trial_end_date', new Date().toISOString())
            .is('stripe_customer_id', null); // No tienen pago configurado

        if (selectError) {
            console.error('Error al buscar usuarios:', selectError);
            throw selectError;
        }

        if (!expiredUsers || expiredUsers.length === 0) {
            console.log('✅ No hay usuarios con trial expirado');
            return new Response(
                JSON.stringify({ message: 'No hay usuarios con trial expirado', count: 0 }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
        }

        console.log(`⚠️ Encontrados ${expiredUsers.length} usuarios con trial expirado`);

        const results = [];

        for (const user of expiredUsers) {
            try {
                // 1. Bajar a tier 'free'
                const { error: updateError } = await supabaseClient
                    .from('user_profiles')
                    .update({
                        subscription_tier: 'free',
                        updated_at: new Date().toISOString()
                    })
                    .eq('user_id', user.user_id);

                if (updateError) {
                    console.error(`Error actualizando usuario ${user.email}:`, updateError);
                    results.push({ email: user.email, status: 'error', error: updateError.message });
                    continue;
                }

                // 2. Enviar email de Brevo (plantilla #6)
                if (brevoApiKey) {
                    const emailData = {
                        to: [{ email: user.email, name: user.nombre || user.email.split('@')[0] }],
                        templateId: 6, // Plantilla "Email de aviso fin de suscripción/error en el pago"
                        params: {
                            NOMBRE: user.nombre || user.email.split('@')[0],
                            PRECIO: user.promo_locked_price || 19.90,
                            LINK_PAGO: `https://despiertatuvoz.com/index.html?upgrade=pro`
                        }
                    };

                    const brevoResponse = await fetch('https://api.brevo.com/v3/smtp/email', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json',
                            'api-key': brevoApiKey,
                            'content-type': 'application/json'
                        },
                        body: JSON.stringify(emailData)
                    });

                    if (!brevoResponse.ok) {
                        const brevoError = await brevoResponse.text();
                        console.error(`Error enviando email a ${user.email}:`, brevoError);
                        results.push({ email: user.email, status: 'downgraded_no_email', error: brevoError });
                    } else {
                        console.log(`✅ Usuario ${user.email} bajado a free y email enviado`);
                        results.push({ email: user.email, status: 'success' });
                    }
                } else {
                    console.log(`✅ Usuario ${user.email} bajado a free (sin email, falta BREVO_API_KEY)`);
                    results.push({ email: user.email, status: 'downgraded_no_email' });
                }

            } catch (err) {
                console.error(`Error procesando usuario ${user.email}:`, err);
                results.push({ email: user.email, status: 'error', error: err.message });
            }
        }

        return new Response(
            JSON.stringify({
                message: 'Proceso completado',
                total: expiredUsers.length,
                results
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );

    } catch (error) {
        console.error('Error crítico:', error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
    }
});
