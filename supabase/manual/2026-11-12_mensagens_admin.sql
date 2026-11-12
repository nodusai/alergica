-- =============================================================================
-- AlerGica — caixa de mensagens do administrador (12/11/2026)
--
-- Libera a página "Mensagens" (/admin/mensagens): status nas mensagens de Suporte,
-- Sugestão e Feedback, leitura/atualização por administradores e a função
-- admin_list_messages(). Pode ser executado mais de uma vez com segurança
-- (não apaga dados; mensagens existentes ficam com status "novo").
--
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
--
-- Para tornar alguém administrador (troque o e-mail):
--   INSERT INTO public.user_roles (user_id, role)
--   SELECT id, 'admin' FROM auth.users WHERE email = 'pessoa@exemplo.com'
--   ON CONFLICT DO NOTHING;
-- =============================================================================


-- 1) Acompanhamento pelo administrador
ALTER TABLE public.suggestions
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.feedback
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'novo',
  ADD COLUMN IF NOT EXISTS status_updated_at TIMESTAMP WITH TIME ZONE;

DO $$ BEGIN
  ALTER TABLE public.suggestions ADD CONSTRAINT suggestions_status_check CHECK (status IN ('novo', 'em_andamento', 'resolvido'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE public.feedback ADD CONSTRAINT feedback_status_check CHECK (status IN ('novo', 'em_andamento', 'resolvido'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_suggestions_created ON public.suggestions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON public.feedback (created_at DESC);

-- 2) Administradores leem e atualizam todas as mensagens
DROP POLICY IF EXISTS "Admins can view all suggestions" ON public.suggestions;
CREATE POLICY "Admins can view all suggestions" ON public.suggestions FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update suggestions" ON public.suggestions;
CREATE POLICY "Admins can update suggestions" ON public.suggestions FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins can view all feedback" ON public.feedback;
CREATE POLICY "Admins can view all feedback" ON public.feedback FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins can update feedback" ON public.feedback;
CREATE POLICY "Admins can update feedback" ON public.feedback FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Lista unificada com nome e e-mail de quem enviou.
--    SECURITY DEFINER: lê auth.users e profiles.full_name SEM dar ao admin acesso aos
--    demais dados do perfil (alergias, observações — dados de saúde, LGPD).
CREATE OR REPLACE FUNCTION public.admin_list_messages()
RETURNS TABLE (
  id UUID,
  source TEXT,
  kind TEXT,
  content TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  status_updated_at TIMESTAMP WITH TIME ZONE,
  user_id UUID,
  user_name TEXT,
  user_email TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT m.id, m.source, m.kind, m.content, m.status, m.created_at, m.status_updated_at,
         m.user_id, p.full_name::TEXT, u.email::TEXT
  FROM (
    SELECT s.id, 'suggestions'::TEXT AS source,
           CASE WHEN s.content LIKE '[Suporte]%' THEN 'suporte' ELSE 'sugestao' END AS kind,
           regexp_replace(s.content, '^\[Suporte\]\s*', '') AS content,
           s.status, s.created_at, s.status_updated_at, s.user_id
    FROM public.suggestions s
    UNION ALL
    SELECT f.id, 'feedback'::TEXT, 'feedback', f.content, f.status, f.created_at, f.status_updated_at, f.user_id
    FROM public.feedback f
  ) m
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  LEFT JOIN auth.users u ON u.id = m.user_id
  ORDER BY m.created_at DESC
  LIMIT 1000;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_messages() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_messages() TO authenticated;
