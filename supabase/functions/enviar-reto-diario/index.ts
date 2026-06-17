import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.1"

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY") || ""
const QWEN_API_KEY = Deno.env.get("QWEN_API_KEY") || ""
const QWEN_BASE_URL = Deno.env.get("QWEN_BASE_URL") || "https://ws-vc3dtuyb2mo8tyf8.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1"
const RETO_TEMPLATE_ID = Number(Deno.env.get("RETO_DIARIO_TEMPLATE_ID") || "28")
const APP_URL = Deno.env.get("APP_URL") || "https://despierta-tu-voz-app.vercel.app"

const supabaseUrl = Deno.env.get("SUPABASE_URL") || ""
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

serve(async (req) => {
  try {
    const { data: retosFallback, error: retoError } = await supabase
      .from("retos_diarios")
      .select("*")
      .eq("activo", true)

    if (retoError || !retosFallback || retosFallback.length === 0) {
      return new Response(JSON.stringify({ error: "No hay retos activos" }), { status: 404 })
    }

    const { data: users, error: userError } = await supabase
      .from("user_profiles")
      .select("user_id, email, nombre, racha_dias, total_retos, ultimo_reto_enviado_at")
      .eq("receive_daily_challenges", true)
      .eq("consent_marketing", true)

    if (userError) throw new Error(userError.message)

    const fecha = new Date().toLocaleDateString("es-ES", {
      weekday: "long", day: "numeric", month: "long", year: "numeric"
    })
    const hoyStr = new Date().toISOString().slice(0, 10)
    let sent = 0, skipped = 0

    for (const user of users) {
      if (user.ultimo_reto_enviado_at?.slice(0, 10) === hoyStr) { skipped++; continue }

      const ayer = new Date()
      ayer.setDate(ayer.getDate() - 1)
      const nuevaRacha = user.ultimo_reto_enviado_at?.slice(0, 10) === ayer.toISOString().slice(0, 10)
        ? (user.racha_dias || 0) + 1 : 1

      // Generar reto personalizado por IA o usar fallback
      let reto = await generarRetoIA(user.user_id, user.nombre, nuevaRacha, retosFallback)

      // Asegurar formato correcto (fallback no tiene estos campos)
      if (!reto.palabras_clave) reto.palabras_clave = "vocalización, calentamiento, técnica"

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          to: [{ email: user.email, name: user.nombre || user.email.split("@")[0] }],
          templateId: RETO_TEMPLATE_ID,
          params: {
            NOMBRE: user.nombre || user.email.split("@")[0],
            FECHA: fecha,
            PALABRAS_CLAVE: reto.palabras_clave || "respiración, presencia, conexión",
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
        const brevoBody = await res.text()
        console.log(`[Brevo OK] ${user.email}: ${brevoBody.slice(0, 300)}`)
        await supabase.from("user_profiles").update({
          racha_dias: nuevaRacha,
          total_retos: (user.total_retos || 0) + 1,
          ultimo_reto_enviado_at: new Date().toISOString()
        }).eq("user_id", user.user_id)
        sent++
      }
    }

    return new Response(JSON.stringify({ sent, skipped, total: users.length }), { status: 200 })

  } catch (error) {
    console.error("[Reto Diario Error]", error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
})

async function generarRetoIA(userId: string, nombre: string | null, racha: number, fallback: any[]) {
  try {
    const semanaAtras = new Date()
    semanaAtras.setDate(semanaAtras.getDate() - 7)

    const { data: mensajes } = await supabase
      .from("mensajes")
      .select("texto, emisor, created_at")
      .eq("alumno", userId)
      .gte("created_at", semanaAtras.toISOString())
      .order("created_at", { ascending: false })
      .limit(10)

    const historial = mensajes?.length
      ? mensajes.reverse().map(m => `[${m.emisor}] ${m.texto}`).join("\n")
      : "El usuario acaba de empezar, no hay historial reciente."

    const prompt = `Eres un coach vocal que crea retos personalizados.
Basándote en el historial del alumno, genera un reto vocal en JSON exacto:
{
  "palabras_clave": "3-5 palabras separadas por coma sobre lo trabajado (ej: apoyo, color de voz, agudos, proyección, resonancia)",
  "titulo": "título corto del reto",
  "descripcion": "texto con los pasos del ejercicio separados por saltos de línea (ej: 1. Párate con los pies separados\n2. Inspira profundamente\n3. Suelta con un suspiro sonoro en Ahhh)",
  "tiempo": "duración (ej: 5 min)",
  "reflexion": "frase inspiradora relacionada"
}

Reglas:
- descripcion debe contener 3-6 pasos concretos, numerados (1. 2. 3.), separados por saltos de línea
- Reto práctico que se haga en menos de 10 min
- Si el historial muestra un tema específico (respiración, afinación, emoción), enfócate en eso
- Si no hay historial, elige un ejercicio de calentamiento básico
- Responde ÚNICAMENTE el JSON, sin markdown ni explicaciones

Historial del alumno (${nombre || "sin nombre"}, racha: ${racha} días):
${historial}`

    const body = JSON.stringify({
      model: "qwen3.5-flash",
      messages: [
        { role: "system", content: "Eres un coach vocal experto. Respondes siempre en JSON válido." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    const res = await fetch(`${QWEN_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${QWEN_API_KEY}`
      },
      body
    })

    if (!res.ok) {
      const errBody = await res.text()
      console.error(`[Qwen API] ${res.status}: ${errBody.slice(0, 500)}`)
      throw new Error(`Qwen ${res.status}`)
    }

    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content?.trim()
    if (!text) throw new Error("Respuesta vacía de Qwen")

    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error("No se encontró JSON en la respuesta")

    const reto = JSON.parse(jsonMatch[0])
    if (!reto.titulo || !reto.descripcion || !reto.tiempo || !reto.reflexion) {
      throw new Error("JSON incompleto")
    }

    // Si descripcion es array, unirlo con saltos de línea
    if (Array.isArray(reto.descripcion)) {
      reto.descripcion = reto.descripcion.join("\n")
    }

    return reto
  } catch (e) {
    console.error(`[Reto Diario IA] Falló generación para ${userId}:`, e.message)
    return fallback[Math.floor(Math.random() * fallback.length)]
  }
}
