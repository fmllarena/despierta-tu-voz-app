import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY')
const RETO_TEMPLATE_ID = Number(Deno.env.get('RETO_DIARIO_TEMPLATE_ID')) || 0
const APP_URL = Deno.env.get('APP_URL') || 'https://despierta-tu-voz-app.vercel.app'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    // 1. Seleccionar un reto aleatorio activo
    const { data: retos, error: retoError } = await supabase
      .from('retos_diarios')
      .select('*')
      .eq('activo', true)

    if (retoError || !retos || retos.length === 0) {
      throw new Error(retoError?.message || 'No hay retos activos')
    }

    const reto = retos[Math.floor(Math.random() * retos.length)]

    // 2. Usuarios que reciben retos diarios
    const { data: users, error: userError } = await supabase
      .from('user_profiles')
      .select('user_id, email, nombre, racha_dias, total_retos')
      .eq('receive_daily_challenges', true)

    if (userError) throw new Error(userError.message)

    const fecha = new Date().toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })

    let sent = 0
    for (const user of users) {
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': BREVO_API_KEY || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: [{ email: user.email, name: user.nombre || user.email.split('@')[0] }],
          templateId: RETO_TEMPLATE_ID,
          params: {
            NOMBRE: user.nombre || user.email.split('@')[0],
            FECHA: fecha,
            RETO_TITULO: reto.titulo,
            RETO_DESCRIPCION: reto.descripcion,
            RETO_TIEMPO: reto.tiempo,
            RETO_REFLEXION: reto.reflexion,
            LINK_APP: APP_URL,
            RACHA_DIAS: String(user.racha_dias || 0),
            TOTAL_RETOS: String(user.total_retos || 0)
          }
        })
      })

      if (res.ok) {
        await supabase.from('user_profiles').update({
          total_retos: (user.total_retos || 0) + 1
        }).eq('user_id', user.user_id)
        sent++
      }
    }

    return new Response(JSON.stringify({ sent, total: users.length }), { status: 200 })

  } catch (error) {
    console.error('[Reto Diario Error]', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
