-- 1) Colunas do perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS allergy_info TEXT,
  ADD COLUMN IF NOT EXISTS observation TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT;

-- 2) Histórico de consentimentos LGPD
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('termos_uso','politica_privacidade','dados_saude')),
  version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.user_consents TO authenticated;
GRANT ALL ON public.user_consents TO service_role;
CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents (user_id, created_at DESC);
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
CREATE POLICY "Users can view their own consents" ON public.user_consents
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can record their own consents" ON public.user_consents;
CREATE POLICY "Users can record their own consents" ON public.user_consents
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Admins can view all consents" ON public.user_consents;
CREATE POLICY "Admins can view all consents" ON public.user_consents
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 3) Contador de acessos dos remédios ("Mais Procurados")
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.increment_medication_access(med_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Autenticação necessária' USING ERRCODE = '42501';
  END IF;
  UPDATE public.medications SET access_count = COALESCE(access_count, 0) + 1 WHERE id = med_id;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_medication_access(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.increment_medication_access(UUID) TO authenticated;