ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS allergy_info text,
  ADD COLUMN IF NOT EXISTS observation text;