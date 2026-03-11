BEGIN;
ALTER TABLE public.user_profiles RENAME COLUMN weekly_goal TO mentor_trato_preferido;
COMMENT ON COLUMN public.user_profiles.mentor_trato_preferido IS 'Trato preferido del usuario para el mentor (ex weekly_goal)';
COMMIT;
