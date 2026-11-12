-- =============================================================================
-- Correção do banco em produção — AlerGica (12/11/2026)
--
-- O banco usado pelo app não recebeu algumas migrações de supabase/migrations.
-- Este script aplica SÓ o que falta e pode ser executado mais de uma vez com segurança
-- (não apaga nem altera dados existentes).
--
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
-- NÃO use `supabase db push` neste banco: ele tentaria recriar a tabela medications
-- (que em produção tem outro formato) e falharia.
-- =============================================================================

-- 1) Colunas do perfil (migrações 20260306000000 e 20260308000000)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS allergy_info TEXT,
  ADD COLUMN IF NOT EXISTS observation TEXT,
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS profession TEXT;

-- 2) Histórico de consentimentos LGPD (migração 20261112000000)
CREATE TABLE IF NOT EXISTS public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL
    CHECK (consent_type IN ('termos_uso', 'politica_privacidade', 'dados_saude')),
  version TEXT NOT NULL,
  granted BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user ON public.user_consents (user_id, created_at DESC);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own consents" ON public.user_consents;
CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can record their own consents" ON public.user_consents;
CREATE POLICY "Users can record their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all consents" ON public.user_consents;
CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Contador de acessos dos remédios — "Mais Procurados" (migração 20260306000005)
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS access_count INTEGER NOT NULL DEFAULT 0;

CREATE OR REPLACE FUNCTION public.increment_medication_access(med_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.medications
  SET access_count = COALESCE(access_count, 0) + 1
  WHERE id = med_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_medication_access(UUID) TO authenticated;

-- 4) Faz a API (PostgREST) enxergar as colunas e a tabela novas imediatamente
NOTIFY pgrst, 'reload schema';

-- Conferência: deve listar as 8 colunas novas
SELECT column_name FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN ('phone','allergy_info','observation','birth_date','gender','city','state','profession')
ORDER BY column_name;
