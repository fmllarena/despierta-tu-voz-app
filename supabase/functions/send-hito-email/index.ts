import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Mapeo de Hitos a Plantillas de Brevo
const HITO_TEMPLATES: Record<number, number> = {
    1: Number(Deno.env.get('BREVO_HITO1_TEMPLATE_ID') || 10),
    2: Number(Deno.env.get('BREVO_HITO2_TEMPLATE_ID') || 11),
    3: Number(Deno.env.get('BREVO_HITO3_TEMPLATE_ID') || 12),
    4: Number(Deno.env.get('BREVO_HITO4_TEMPLATE_ID') || 13),
    5: Number(Deno.env.get('BREVO_HITO5_TEMPLATE_ID') || 14),
}

console.log("Edge Function 'send-hito-email' (v1.0) - Milestone Mastery");

serve(async (req) => {
    try {
        const payload = await req.json()
        const { record, old_record } = payload

        if (!record || !record.user_id) {
            return new Response(JSON.stringify({ error: 'Payload inválido' }), { status: 400 })
        }

        const hitoId = record.last_hito_completed
        const oldHitoId = old_record?.last_hito_completed || 0

        // 1. Validar que el hito ha cambiado y es válido (1-4)
        if (hitoId === oldHitoId || !HITO_TEMPLATES[hitoId]) {
            console.log(`[Abort] Hito ${hitoId} no requiere acción o es igual al anterior.`);
            return new Response(JSON.stringify({ message: 'Sin cambios relevantes' }), { status: 200 })
        }

        const userId = record.user_id
        const hitoColumn = `hito${hitoId}_sent`

        // 2. BLOQUEO ATÓMICO: Evita envíos duplicados si el trigger se dispara varias veces
        const { data: lockResult, error: lockError } = await supabase
            .from('user_profiles')
            .update({ [hitoColumn]: true })
            .eq('user_id', userId)
            .eq(hitoColumn, false) // Solo si aún es false
            .select()

        if (lockError || !lockResult || lockResult.length === 0) {
            console.log(`[Escudo] Email Hito ${hitoId} ya enviado anteriormente a ${userId}.`);
            return new Response(JSON.stringify({ message: 'Email ya enviado' }), { status: 200 })
        }

        // Datos del usuario para el email
        const userEmail = record.email
        const userName = record.nombre || userEmail.split('@')[0]
        const templateId = HITO_TEMPLATES[hitoId]

        console.log(`[Procesando] Hito ${hitoId} para ${userEmail}. Template: ${templateId}`);

        // 3. ENVIAR EMAIL TRANSACCIONAL VÍA BREVO
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': BREVO_API_KEY || '',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                to: [{ email: userEmail, name: userName }],
                templateId: templateId,
                params: { NOMBRE: userName } // Usamos params.NOMBRE en la plantilla
            })
        })

        const result = await response.json()
        console.log(`[Éxito] Email Hito ${hitoId} enviado a ${userEmail}.`);

        return new Response(JSON.stringify(result), { status: response.status })

    } catch (error) {
        console.error("[Error Crítico]:", error.message)
        return new Response(JSON.stringify({ error: error.message }), { status: 500 })
    }
})
