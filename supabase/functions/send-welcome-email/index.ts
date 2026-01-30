import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const FREE_TEMPLATE_ID = Number(Deno.env.get('BREVO_FREE_TEMPLATE_ID') || 4)
const PRO_TEMPLATE_ID = Number(Deno.env.get('BREVO_PRO_TEMPLATE_ID') || 5)
const PREMIUM_TEMPLATE_ID = Number(Deno.env.get('BREVO_PREMIUM_TEMPLATE_ID') || 7)

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log("Edge Function 'send-welcome-email' (v3.0) - Multi-tier Mastery");

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record } = payload

        if (!record || !record.email) {
            return new Response(JSON.stringify({ error: 'Payload inválido' }), { status: 400 })
        }

        const userEmail = record.email
        const tier = record.subscription_tier || 'free'

        // 1. RESTRICCIÓN: Solo si está confirmado
        if (!record.email_confirmado_at) {
            console.log(`[Abort] ${userEmail} no confirmado aún.`);
            return new Response(JSON.stringify({ message: 'Esperando confirmación' }), { status: 200 })
        }

        // Mapear el tier a su columna de control y template
        let sentColumn = 'bienvenida_free_sent'
        let templateId = FREE_TEMPLATE_ID

        if (tier === 'pro') {
            sentColumn = 'bienvenida_pro_sent'
            templateId = PRO_TEMPLATE_ID
        } else if (tier === 'premium') {
            sentColumn = 'bienvenida_premium_sent'
            templateId = PREMIUM_TEMPLATE_ID
        }

        // 2. BLOQUEO ATÓMICO POR NIVEL
        // Intentamos marcar el mail de ESTE nivel como enviado
        const { data: lockResult, error: lockError } = await supabase
            .from('user_profiles')
            .update({ [sentColumn]: true })
            .eq('user_id', record.user_id)
            .eq(sentColumn, false)
            .select()

        if (lockError || !lockResult || lockResult.length === 0) {
            console.log(`[Escudo] Email de tipo '${tier}' ya enviado anteriormente a ${userEmail}.`);
            return new Response(JSON.stringify({ message: 'Email de este nivel ya enviado' }), { status: 200 })
        }

        console.log(`[Procesando] Nivel: ${tier} para ${userEmail}. Template: ${templateId}`);

        const userName = record.nombre || userEmail.split('@')[0]

        // 3. SINCRONIZAR ATRIBUTO EN BREVO
        await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: { 'api-key': BREVO_API_KEY || '', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: userEmail,
                attributes: { NOMBRE: userName },
                updateEnabled: true
            })
        })

        // 4. ENVIAR EMAIL TRANSACCIONAL
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: { 'api-key': BREVO_API_KEY || '', 'Content-Type': 'application/json' },
            body: JSON.stringify({
                to: [{ email: userEmail, name: userName }],
                templateId: templateId,
                params: { NOMBRE: userName }
            })
        })

        const result = await response.json()
        console.log(`[Éxito] Bienvenida '${tier}' enviada a ${userEmail}.`);

        return new Response(JSON.stringify(result), { status: response.status })

    } catch (error) {
        console.error("[Error Crítico]:", error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
