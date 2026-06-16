import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || ""
const RETO_TEMPLATE_ID = Number(Deno.env.get("RETO_DIARIO_TEMPLATE_ID") || "0")
const APP_URL = Deno.env.get("APP_URL") || "https://despierta-tu-voz-app.vercel.app"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    // 1. Seleccionar un reto aleatorio activo
    const { data: retos, error: retoError } = await supabase
      .from("retos_diarios")
      .select("*")
      .eq("activo", true)

    if (retoError || !retos || retos.length === 0) {
      console.error("[Reto Diario] No hay retos activos en la tabla retos_diarios")
      return new Response(JSON.stringify({ error: "No hay retos activos" }), { status: 404 })
    }

    const reto = retos[Math.floor(Math.random() * retos.length)]
    console.log(`[Reto Diario] Reto seleccionado: "${reto.titulo}"`)

    // 2. Usuarios que reciben retos diarios
    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("user_id, email, nombre, racha_dias, total_retos, ultimo_reto_enviado_at, consent_marketing")
      .eq("receive_daily_challenges", true)
      .eq("consent_marketing", true)

    if (userError) throw new Error(userError.message)
    console.log(`[Reto Diario] ${users.length} usuarios para enviar`)

    const fecha = new Date().toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    })

    const hoyStr = new Date().toISOString().slice(0, 10)
    let sent = 0
    let skipped = 0

    for (const user of users) {
      // Omitir si ya se envió hoy
      if (user.ultimo_reto_enviado_at?.slice(0, 10) === hoyStr) {
        skipped++
        continue
      }

      // Calcular racha
      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      const ayerStr = ayer.toISOString().slice(0, 10)
      const nuevaRacha = user.ultimo_reto_enviado_at?.slice(0, 10) === ayerStr
        ? (user.racha_dias || 0) + 1
        : 1

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          to: [{ email: user.email, name: user.nombre || user.email.split("@")[0] }],
          templateId: RETO_TEMPLATE_ID,
          params: {
            NOMBRE: user.nombre || user.email.split("@")[0],
            FECHA: fecha,
            RETO_TITULO: reto.titulo,
            RETO_DESCRIPCION: reto.descripcion,
            RETO_TIEMPO: reto.tiempo,
            RETO_REFLEXION: reto.reflexion,
            LINK_APP: APP_URL,
            RACHA_DIAS: String(nuevaRacha),
            TOTAL_RETOS: String((user.total_retos || 0) + 1)
          }
        })
      })

      if (res.ok) {
        await supabase.from("user_profiles").update({
          racha_dias: nuevaRacha,
          total_retos: (user.total_retos || 0) + 1,
          ultimo_reto_enviado_at: new Date().toISOString()
        }).eq("user_id", user.user_id)
        sent++
      } else {
        const errBody = await res.text()
        console.error(`[Reto Diario] Error Brevo para ${user.email}:`, errBody)
      }
    }

    console.log(`[Reto Diario] Enviados: ${sent}, Omitidos (ya enviados hoy): ${skipped}`)
    return new Response(JSON.stringify({ sent, skipped, total: users.length }), { status: 200 })

  } catch (error) {
    console.error("[Reto Diario Error]", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})
