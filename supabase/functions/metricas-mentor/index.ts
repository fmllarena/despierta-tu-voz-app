import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

        // Verificar JWT del usuario logueado
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'No autorizado' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: authError } = await supabase.auth.getUser(token)

        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Token inválido' }), {
                status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Solo el mentor puede ver métricas globales
        const email = String(user.email || '').toLowerCase()
        const role = (user.app_metadata?.role || user.user_metadata?.role) || ''
        const isMentor = role === 'mentor' || role === 'admin' || email === 'fernando@despiertatuvoz.com'

        if (!isMentor) {
            return new Response(JSON.stringify({ error: 'Solo el mentor puede ver estas métricas' }), {
                status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            })
        }

        // Leer vistas de métricas
        const { data: embudo, error: embudoError } = await supabase
            .from('v_usuario_embudo')
            .select('*')

        if (embudoError) throw embudoError

        const { data: diarias, error: diariasError } = await supabase
            .from('v_metricas_diarias')
            .select('*')
            .order('dia', { ascending: true })

        if (diariasError) throw diariasError

        // Calcular agregados del embudo
        const totalUsuarios = embudo?.length || 0
        const escribieron = embudo?.filter(u => u.primer_mensaje).length || 0
        const cincoMensajes = embudo?.filter(u => (u.mensajes_usuario || 0) >= 5).length || 0
        const dosHilos = embudo?.filter(u => (u.conversaciones || 0) >= 2).length || 0
        const guardaron = embudo?.filter(u => (u.guardados || 0) > 0).length || 0
        const dePago = embudo?.filter(u => u.plan !== 'free').length || 0

        const pctActivacion = totalUsuarios > 0 ? round100(escribieron / totalUsuarios) : 0
        const pctConversion = totalUsuarios > 0 ? round100(dePago / totalUsuarios) : 0

        return new Response(JSON.stringify({
            totalUsuarios,
            escribieron,
            cincoMensajes,
            dosHilos,
            guardaron,
            dePago,
            pctActivacion,
            pctConversion,
            metricasDiarias: diarias || [],
            embudo: embudo || []
        }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })

    } catch (error) {
        console.error("[metricas-mentor Error]", error.message)
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
})

function round100(val: number): number {
    return Math.round(val * 1000) / 10
}
