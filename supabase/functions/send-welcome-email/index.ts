import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const FREE_TEMPLATE_ID = Number(Deno.env.get('BREVO_FREE_TEMPLATE_ID') || 4)
const PRO_TEMPLATE_ID = Number(Deno.env.get('BREVO_PRO_TEMPLATE_ID') || 5)
const PREMIUM_TEMPLATE_ID = Number(Deno.env.get('BREVO_PREMIUM_TEMPLATE_ID') || 7)

console.log("Edge Function 'send-welcome-email' iniciada (Multi-tier)");

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record, type } = payload

        if (!record || !record.email) {
            return new Response(JSON.stringify({ error: 'No se encontró email en el registro' }), { status: 400 })
        }

        const userEmail = record.email
        const userName = record.nombre || record.email.split('@')[0]
        const tier = record.subscription_tier || 'free'

        // Selección de plantilla según el nivel
        let templateId = FREE_TEMPLATE_ID
        if (tier === 'pro') templateId = PRO_TEMPLATE_ID
        else if (tier === 'premium') templateId = PREMIUM_TEMPLATE_ID

        console.log(`Enviando bienvenida [${tier}] a: ${userEmail} (Template: ${templateId})`);

        // Llamada a la API de Brevo
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY || '',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                to: [{ email: userEmail, name: userName }],
                templateId: templateId,
                params: {
                    NOMBRE: userName
                }
            })
        })

        const result = await response.json()
        console.log("Respuesta de Brevo:", result)

        return new Response(JSON.stringify(result), {
            status: response.status,
            headers: { "Content-Type": "application/json" }
        })

    } catch (error) {
        console.error("Error en Edge Function:", error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
