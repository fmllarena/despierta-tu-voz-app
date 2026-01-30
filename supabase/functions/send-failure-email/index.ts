import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const FAILURE_TEMPLATE_ID = 6

console.log("Edge Function 'send-failure-email' (v1.0) - Subscription Recovery");

serve(async (req) => {
    try {
        const payload = await req.json()
        const { user } = payload

        if (!user || !user.email) {
            return new Response(JSON.stringify({ error: 'Usuario inválido' }), { status: 400 })
        }

        const userEmail = user.email
        const userName = user.nombre || userEmail.split('@')[0]

        console.log(`[Procesando] Email de fallo para ${userEmail}. Template: ${FAILURE_TEMPLATE_ID}`);

        // ENVIAR EMAIL TRANSACCIONAL VÍA BREVO
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: [{ email: userEmail, name: userName }],
                templateId: FAILURE_TEMPLATE_ID,
                params: {
                    NOMBRE: userName
                    // El botón en Brevo debe apuntar a: https://app.despiertatuvoz.com/landing.html#precios
                }
            })
        })

        const result = await response.json()
        console.log(`[Éxito] Email de fallo enviado a ${userEmail}.`);

        return new Response(JSON.stringify(result), { status: response.status })

    } catch (error) {
        console.error("[Error Crítico]:", error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
