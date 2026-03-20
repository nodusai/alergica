ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birth_date text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS profession text;