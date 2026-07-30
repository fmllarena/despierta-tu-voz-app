-- Ampliar CHECK de role en teacher para aceptar tips_diarios
ALTER TABLE public.teacher DROP CONSTRAINT IF EXISTS teacher_role_check;
ALTER TABLE public.teacher ADD CONSTRAINT teacher_role_check
    CHECK (role IN ('user', 'assistant', 'tips_diarios'));
