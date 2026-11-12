-- LGPD: histórico de consentimentos do titular (art. 8º, §2º — o ônus da prova do consentimento é do controlador)
-- O registro principal também fica em auth.users.raw_user_meta_data->'lgpd_consents' (gravado no cadastro).

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

-- O titular vê e registra os próprios consentimentos. Não há UPDATE/DELETE pelo usuário:
-- o histórico é só de inclusão; a exclusão acontece junto com a conta (ON DELETE CASCADE).
CREATE POLICY "Users can view their own consents"
  ON public.user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can record their own consents"
  ON public.user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents"
  ON public.user_consents FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
