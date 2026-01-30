import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const BREVO_LIST_ID = 2 // Cambia esto por el ID de tu lista en Brevo

console.log("Edge Function 'brevo-sync' iniciada");

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record } = payload

        if (!record || !record.email) {
            return new Response(JSON.stringify({ error: 'No se encontró email en el registro' }), { status: 400 })
        }

        console.log(`Sincronizando con Brevo: ${record.email}`);

        // Llamada a la API de Brevo
        const response = await fetch('https://api.brevo.com/v3/contacts', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY || '',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                email: record.email,
                attributes: {
                    NOMBRE: record.nombre || record.email.split('@')[0],
                    CONSENT_MARKETING: !!record.consent_marketing,
                    CONSENT_LIFECYCLE: !!record.consent_lifecycle
                },
                listIds: !!record.consent_marketing ? [Number(BREVO_LIST_ID)] : [],
                unlinkListIds: !record.consent_marketing ? [Number(BREVO_LIST_ID)] : [],
                updateEnabled: true
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
