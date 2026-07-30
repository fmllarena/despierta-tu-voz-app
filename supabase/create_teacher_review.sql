-- Tabla teacher_review: seguimiento de tips completados en el quiz
CREATE TABLE IF NOT EXISTS public.teacher_review (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    tip_key text NOT NULL,
    completed_at timestamptz DEFAULT now()
);

-- Un mismo tip no debe registrarse dos veces por usuario
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_review_tip_key
    ON public.teacher_review(user_id, tip_key);

CREATE INDEX IF NOT EXISTS idx_teacher_review_user_id
    ON public.teacher_review(user_id);

ALTER TABLE public.teacher_review ENABLE ROW LEVEL SECURITY;

-- Mentor
DROP POLICY IF EXISTS "Mentor puede ver teacher_review" ON public.teacher_review;
CREATE POLICY "Mentor puede ver teacher_review"
ON public.teacher_review FOR SELECT
USING ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

DROP POLICY IF EXISTS "Mentor puede insertar teacher_review" ON public.teacher_review;
CREATE POLICY "Mentor puede insertar teacher_review"
ON public.teacher_review FOR INSERT
WITH CHECK ( (auth.jwt() ->> 'email') = 'fernando@despiertatuvoz.com' );

-- Usuario
DROP POLICY IF EXISTS "Usuario puede ver su teacher_review" ON public.teacher_review;
CREATE POLICY "Usuario puede ver su teacher_review"
ON public.teacher_review FOR SELECT
USING ( auth.uid() = user_id );

DROP POLICY IF EXISTS "Usuario puede insertar su teacher_review" ON public.teacher_review;
CREATE POLICY "Usuario puede insertar su teacher_review"
ON public.teacher_review FOR INSERT
WITH CHECK ( auth.uid() = user_id );
