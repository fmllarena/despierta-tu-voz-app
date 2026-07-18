-- ============================================================
-- Seed: 5 perfiles de prueba para Roleplay - Mentor Vocal
-- Uso: Ejecutar en Supabase SQL Editor (dashboard)
-- NO requiere auth.users — dropea FK constraints para poder
-- insertar directamente en user_profiles con UUIDs generados.
-- ============================================================

-- 1. Eliminar FK constraints que apuntan a auth.users(id)
--    (necesario para inserts de prueba sin auth real)
ALTER TABLE IF EXISTS public.mensajes
  DROP CONSTRAINT IF EXISTS mensajes_alumno_fkey,
  DROP CONSTRAINT IF EXISTS fk_mensajes_alumno;

ALTER TABLE IF EXISTS public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey,
  DROP CONSTRAINT IF EXISTS fk_user_profiles_user_id;

-- 2. Generar 5 UUIDs estables para los perfiles
--    (usamos UUIDs fijos para que sean reproducibles)
--    NOTA: reemplázalos si hay conflicto con user_ids existentes
INSERT INTO public.user_profiles (
    user_id,
    email,
    nombre,
    subscription_tier,
    ultimo_resumen,
    historia_vocal,
    creencias_transmutadas,
    nivel_alquimia,
    mentor_notes,
    mentor_trato_preferido,
    mentor_focus,
    mentor_personality,
    mentor_length
) VALUES
-- ALMA — "La Voz Atrapada" | Mujer, 28 | EXPLORA (4/10)
(
    'a0000000-0000-0000-0000-000000000001',
    'alma.voz@test.com',
    'Alma García',
    'free',
    'Alma está en etapa EXPLORA. Ha identificado que su voz «se apaga» cuando habla de temas personales. Hoy logró mantener volumen constante durante 3 minutos. Se sintió orgullosa pero agotada.',
    'Creció en un hogar donde le repetían «habla más bajo, molestas». Su voz se volvió un susurro. Evita llamadas telefónicas. En reuniones opta por escribir en chat antes que hablar. Siente que su voz «no es bienvenida» en espacios compartidos. Sueña con poder expresar una opinión sin disculparse.',
    '"Mi voz molesta" → "Mi voz puede ocupar espacio"',
    '4',
    'Muy sensible a críticas. Responder siempre con validación primero. Celebrar micro-logros. No presionar con ejercicios de volumen intensos.',
    'Empático y validante',
    0.8, 0.9, 0.6
),
-- CARLOS — "El Vendedor Ronco" | Hombre, 35 | PROFUNDIZA (6/10)
(
    'a0000000-0000-0000-0000-000000000002',
    'carlos.voz@test.com',
    'Carlos Mendoza',
    'free',
    'Carlos está en PROFUNDIZA. Identificó que su monotonía aumenta bajo estrés con clientes difíciles. Hoy logró modular tono en una llamada real. Se emocionó al notar la diferencia en la reacción del cliente.',
    'Trabaja 8h diarias en ventas. Su voz se volvió herramienta, perdió calidez y matices. Habla en piloto automático. Siente que «vende hasta cuando saluda». Su esposa le dijo que ya no reconoce su voz de cuando se conocieron. Busca recuperar la conexión emocional con su habla.',
    '"Mi voz es una herramienta de trabajo" → "Mi voz es expresión de quien soy"',
    '6',
    'Avanza lento pero consistente. Celebrar pequeños logros. Usar metáforas de instrumento musical. Tiene tendencia a ser muy autocrítico.',
    'Motivador y estratégico',
    0.4, 0.6, 0.7
),
-- DANIELA — "La Transformación Profunda" | Mujer, 42 | CIERRE (8/10)
(
    'a0000000-0000-0000-0000-000000000003',
    'daniela.voz@test.com',
    'Daniela Reyes',
    'free',
    'Daniela está en CIERRE. Dio una capacitación de 2h usando su voz natural (sin impostación grave). Recibió feedback de que sonaba «más auténtica y segura». Su meta ahora es llevar esta voz a reuniones ejecutivas de alto estrés.',
    'En secundaria sufría bullying por su voz aguda «de niña». Para ser tomada en serio, se forzó a bajar artificialmente el tono. Ahora suena impostada y se fatiga vocalmente. Es coach de equipos y dirige reuniones grandes. Busca su voz auténtica sin esfuerzo.',
    '"Una voz grave es la única voz de autoridad" → "La autenticidad es la verdadera autoridad"',
    '8',
    'Está lista para desafíos reales. Darle ejercicios de proyección sin forzar. Es la estudiante más avanzada. Retarla con reuniones de alta presión.',
    'Directo y desafiante',
    0.3, 0.3, 0.8
),
-- ELENA — "La Voz Silicon Valley" | Mujer, 31 | INICIO (3/10)
(
    'a0000000-0000-0000-0000-000000000004',
    'elena.voz@test.com',
    'Elena Torres',
    'free',
    'Elena está en INICIO. Acaba de identificar su patrón de velocidad. Hoy hizo su primer ejercicio de pausa consciente de 1 segundo. Reportó que «fue eterno» pero notó que le prestaron más atención.',
    'Siete años en startups tech siendo mujer y latina. Desarrolló «voz rápida» para alcanzar a hablar antes de que la interrumpan. Su velocidad es 1.5x sin pausas. Denota ansiedad crónica. Quiere aprender a utilizar el silencio como herramienta de poder.',
    '"Si no hablo rápido, no me dejarán hablar" → "Mis pausas son mi poder. Merecen ser escuchadas."',
    '3',
    'Mucha resistencia a disminuir velocidad. Validar su contexto laboral real. Empezar con micro-pausas de 1 segundo. Avanzar con paciencia por su ansiedad.',
    'Paciente y comprensivo',
    0.6, 0.8, 0.5
),
-- MIGUEL — "El Tartamudo Silencioso" | Hombre, 39 | INICIO (2/10)
(
    'a0000000-0000-0000-0000-000000000005',
    'miguel.voz@test.com',
    'Miguel Ángel Ruiz',
    'free',
    'Miguel está en INICIO. Por primera vez verbalizó que evita hablar por miedo a «trabarse». Hoy logró mantener una conversación de 5 minutos sin bloqueos significativos.',
    'Tartamudez severa en infancia. Tratada pero dejó cicatriz emocional. Hoy el bloqueo es más emocional que físico. Evita conversaciones largas, reuniones, llamadas. Prefiere el silencio y trabajo solitario. Es arquitecto, puede pasar días sin hablar. Busca fluidez sin ansiedad.',
    '"No merezco ser escuchado, mi voz traba todo" → "Mis pausas no me definen. Tengo cosas valiosas que decir."',
    '2',
    'EXTREMADAMENTE frágil con este tema. NO mencionar «tartamudez». Usar «ritmo natural» y «fluidez». Cada interacción terminar con refuerzo positivo explícito.',
    'Cuidadoso y positivo',
    0.7, 0.9, 0.4
);

-- 3. Verificación
SELECT user_id, email, nombre, nivel_alquimia, mentor_trato_preferido
FROM public.user_profiles
WHERE email LIKE '%@test.com'
ORDER BY nombre;
