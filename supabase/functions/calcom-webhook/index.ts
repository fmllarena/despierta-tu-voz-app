import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

console.log("Edge Function 'calcom-webhook' (v1.0) - Session Quota Tracker");

serve(async (req) => {
    try {
        const payload = await req.json()

        // Cal.com envía varios tipos de eventos. Nos interesa 'BOOKING_CREATED' y 'BOOKING_CANCELLED'
        const rawEvent = (payload.triggerEvent || "").toUpperCase();
        const eventType = rawEvent.replace('.', '_'); // Normalizar BOOKING.CREATED a BOOKING_CREATED
        const booking = payload.payload;

        if (eventType !== 'BOOKING_CREATED' && eventType !== 'BOOKING_CANCELLED') {
            return new Response(JSON.stringify({ status: 'ignored', event: rawEvent }), { status: 200 });
        }

        // 1. Obtener el email del usuario y normalizarlo
        const userEmail = (booking.attendees?.[0]?.email || "").toLowerCase().trim();
        const durationMinutes = Number(booking.duration) || 0;

        if (!userEmail) {
            console.error("No se encontró email en el payload de Cal.com");
            return new Response(JSON.stringify({ error: 'No email found' }), { status: 400 });
        }

        console.log(`[Cal.com] Evento ${eventType} para ${userEmail}. Duración: ${durationMinutes} min.`);

        // 2. Buscar al usuario en Supabase (insensible a mayúsculas/minúsculas)
        const { data: profile, error: searchError } = await supabase
            .from('user_profiles')
            .select('user_id, sessions_minutes_consumed, subscription_tier')
            .ilike('email', userEmail)
            .single();

        if (searchError || !profile) {
            console.error(`Usuario no encontrado o error en búsqueda: ${userEmail}`, searchError);
            return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 });
        }

        // 3. Solo contamos minutos si es el plan Premium/Transforma y no es una sesión "extra"
        const eventTitle = (booking.title || "").toLowerCase();
        const isExtra = eventTitle.includes("extra");
        const userTier = (profile.subscription_tier || "").toLowerCase().trim();

        if ((userTier === 'premium' || userTier === 'transforma') && !isExtra) {
            let newTotal = profile.sessions_minutes_consumed || 0;

            if (eventType === 'BOOKING_CREATED') {
                newTotal += durationMinutes;
                console.log(`[Cal.com] Sumando ${durationMinutes} min a ${userEmail}. Nuevo total: ${newTotal}`);
            } else if (eventType === 'BOOKING_CANCELLED') {
                newTotal = Math.max(0, newTotal - durationMinutes);
                console.log(`[Cal.com] Restando ${durationMinutes} min a ${userEmail}. Nuevo total: ${newTotal}`);
            }

            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ sessions_minutes_consumed: newTotal, last_active_at: new Date().toISOString() })
                .eq('user_id', profile.user_id);

            if (updateError) {
                console.error("Error actualizando cuota:", updateError);
                return new Response(JSON.stringify({ error: 'Update failed' }), { status: 500 });
            }

            console.log(`[Éxito] Cuota actualizada para ${userEmail}: ${newTotal}/60 min.`);
        } else {
            console.log(`[Info] Sesión ignorada (Tier: ${userTier}, Extra: ${isExtra}, Evento: ${eventType})`);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error) {
        console.error("[Error Crítico Cal.com Webhook]:", error.message);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
})
