-- ============================================================================
-- Métricas de producto (embudo, activación y retención)
-- ============================================================================
-- Se calculan SOBRE DATOS QUE YA EXISTEN; no requieren analítica de terceros,
-- ni cookies, ni consentimiento adicional (art. 6.1.b/f RGPD: interés
-- legítimo en métricas agregadas del propio servicio).
--
-- Ejecutar en Supabase → SQL Editor (como owner/postgres).
--
-- IMPORTANTE (seguridad): las vistas NO tienen RLS. Supabase concede por
-- defecto privilegios a anon/authenticated sobre objetos nuevos de `public`,
-- así que al final del fichero se REVOCAN explícitamente. Sin esos REVOKE,
-- cualquier usuario podría leer métricas de todos. No los quites.
-- ============================================================================

-- ── 1. Una fila por usuario con su recorrido ────────────────────────────────
CREATE OR REPLACE VIEW public.v_usuario_embudo AS
SELECT
    p.user_id,
    p.email,
    p.created_at                                   AS alta,
    p.subscription_tier                            AS plan,
    p.trial_end_date,
    p.last_active_at,
    p.last_hito_completed,
    (SELECT min(m.created_at)
       FROM public.mensajes m
      WHERE m.alumno = p.user_id AND m.emisor = 'usuario')        AS primer_mensaje,
    (SELECT count(*)
       FROM public.mensajes m
      WHERE m.alumno = p.user_id AND m.emisor = 'usuario')        AS mensajes_usuario,
    (SELECT count(*)
       FROM public.mensajes m
      WHERE m.alumno = p.user_id AND m.emisor = 'ia')             AS mensajes_ia,
    (SELECT count(*)
       FROM public.conversaciones c
      WHERE c.alumno = p.user_id)                                 AS conversaciones,
    (SELECT count(*)
       FROM public.mensajes_guardados g
      WHERE g.alumno_id = p.user_id)                              AS guardados
FROM public.user_profiles p;

COMMENT ON VIEW public.v_usuario_embudo IS
    'Recorrido de cada usuario: alta, primer mensaje, volumen de uso y plan.';

-- ── 2. Actividad diaria (para retención) ────────────────────────────────────
CREATE OR REPLACE VIEW public.v_actividad_diaria AS
SELECT
    m.alumno                                       AS user_id,
    date_trunc('day', m.created_at)::date          AS dia,
    count(*) FILTER (WHERE m.emisor = 'usuario')   AS mensajes_usuario,
    count(*) FILTER (WHERE m.emisor = 'ia')        AS mensajes_ia
FROM public.mensajes m
WHERE m.alumno IS NOT NULL
  AND m.emisor IN ('usuario', 'ia')
GROUP BY 1, 2;

COMMENT ON VIEW public.v_actividad_diaria IS
    'Días con actividad real por usuario (excluye resumen_diario y sistema).';

-- ── 3. Métricas diarias globales ────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_metricas_diarias AS
WITH altas AS (
    SELECT created_at::date AS dia, count(*) AS altas
      FROM public.user_profiles
     GROUP BY 1
),
activos AS (
    SELECT dia, count(DISTINCT user_id) AS usuarios_activos,
           sum(mensajes_usuario)        AS mensajes_usuario
      FROM public.v_actividad_diaria
     GROUP BY 1
)
SELECT
    COALESCE(a.dia, ac.dia)              AS dia,
    COALESCE(a.altas, 0)                 AS altas,
    COALESCE(ac.usuarios_activos, 0)     AS usuarios_activos,
    COALESCE(ac.mensajes_usuario, 0)     AS mensajes_usuario
FROM altas a
FULL OUTER JOIN activos ac ON ac.dia = a.dia
ORDER BY 1;

COMMENT ON VIEW public.v_metricas_diarias IS
    'Altas, usuarios activos y mensajes por día.';

-- ── 4. Seguridad: nadie salvo el owner puede leer las vistas ────────────────
REVOKE ALL ON public.v_usuario_embudo   FROM anon, authenticated;
REVOKE ALL ON public.v_actividad_diaria FROM anon, authenticated;
REVOKE ALL ON public.v_metricas_diarias FROM anon, authenticated;

-- ============================================================================
-- CONSULTAS (ejecutar a mano en el SQL Editor)
-- ============================================================================

-- 4.1 EMBUDO PRINCIPAL ------------------------------------------------------
-- Requisito: la vista. Cambia el periodo si quieres acotar (ej. 30 días).
SELECT
    count(*)                                                          AS altas,
    count(*) FILTER (WHERE primer_mensaje IS NOT NULL)                AS escribieron,
    count(*) FILTER (WHERE mensajes_usuario >= 5)                     AS cinco_mensajes,
    count(*) FILTER (WHERE conversaciones >= 2)                       AS dos_hilos,
    count(*) FILTER (WHERE guardados > 0)                             AS guardaron,
    count(*) FILTER (WHERE plan <> 'free')                            AS de_pago,
    round(100.0 * count(*) FILTER (WHERE primer_mensaje IS NOT NULL)
          / nullif(count(*), 0), 1)                                   AS pct_activacion,
    round(100.0 * count(*) FILTER (WHERE plan <> 'free')
          / nullif(count(*), 0), 1)                                   AS pct_conversion
FROM public.v_usuario_embudo
WHERE alta >= now() - interval '90 days';

-- 4.2 TIEMPO HASTA EL PRIMER MENSAJE ---------------------------------------
-- Si la mediana es alta, el problema está en el onboarding.
SELECT
    percentile_cont(0.5) WITHIN GROUP (
        ORDER BY EXTRACT(EPOCH FROM (primer_mensaje - alta)) / 60
    )                                          AS mediana_minutos,
    count(*) FILTER (WHERE primer_mensaje IS NULL) AS nunca_escribieron,
    count(*)                                       AS total
FROM public.v_usuario_embudo;

-- 4.3 ACTIVACIÓN POR SEMANA DE ALTA ----------------------------------------
SELECT
    date_trunc('week', alta)::date        AS semana_alta,
    count(*)                              AS altas,
    count(*) FILTER (WHERE primer_mensaje IS NOT NULL) AS activados,
    round(100.0 * count(*) FILTER (WHERE primer_mensaje IS NOT NULL)
          / nullif(count(*), 0), 1)       AS pct_activacion
FROM public.v_usuario_embudo
GROUP BY 1
ORDER BY 1 DESC
LIMIT 12;

-- 4.4 RETENCIÓN D1 / D7 / D30 ----------------------------------------------
-- Un usuario "retiene" si vuelve a tener actividad un día posterior al alta.
WITH cohorte AS (
    SELECT e.user_id, e.alta::date AS dia_alta
      FROM public.v_usuario_embudo e
),
vuelve AS (
    SELECT c.user_id, c.dia_alta,
           min(a.dia) AS primera_vuelta
      FROM cohorte c
      JOIN public.v_actividad_diaria a
        ON a.user_id = c.user_id AND a.dia > c.dia_alta
     GROUP BY c.user_id, c.dia_alta
)
SELECT
    count(*)                                                          AS usuarios,
    count(*) FILTER (WHERE primera_vuelta - dia_alta <= 1)            AS d1,
    count(*) FILTER (WHERE primera_vuelta - dia_alta <= 7)            AS d7,
    count(*) FILTER (WHERE primera_vuelta - dia_alta <= 30)           AS d30,
    round(100.0 * count(*) FILTER (WHERE primera_vuelta - dia_alta <= 1)
          / nullif(count(*), 0), 1)                                   AS pct_d1,
    round(100.0 * count(*) FILTER (WHERE primera_vuelta - dia_alta <= 7)
          / nullif(count(*), 0), 1)                                   AS pct_d7
FROM vuelve;

-- 4.5 PLANES Y TRIALS -------------------------------------------------------
SELECT
    plan,
    count(*)                                                          AS usuarios,
    count(*) FILTER (WHERE trial_end_date > now())                    AS en_trial,
    count(*) FILTER (WHERE trial_end_date BETWEEN now() AND now() + interval '7 days') AS trial_acaba_7d
FROM public.v_usuario_embudo
GROUP BY 1
ORDER BY 2 DESC;

-- 4.6 USUARIOS QUE MÁS USAN LA APP (para entrevistas) ----------------------
SELECT email, plan, mensajes_usuario, conversaciones, guardados, last_active_at
  FROM public.v_usuario_embudo
 ORDER BY mensajes_usuario DESC
 LIMIT 20;

-- 4.7 SEÑAL DE VALOR: cuántos guardan algo y en qué día lo hacen -----------
SELECT
    count(*)                                          AS con_guardados,
    round(100.0 * count(*) / nullif((SELECT count(*) FROM public.v_usuario_embudo), 0), 1) AS pct
FROM public.v_usuario_embudo
WHERE guardados > 0;
