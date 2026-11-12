-- =============================================================================
-- AlerGica — bulas guardadas no próprio app (12/11/2026)
--
-- Cria o bucket "bulas" no Storage, as colunas de versão da bula em medications,
-- o histórico bula_versoes e as funções do administrador. Pode ser executado mais
-- de uma vez com segurança (não apaga dados).
--
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
-- Depois: envie as bulas pela página do remédio (administrador) ou pelo script
-- scripts/sync-bulas.mjs (veja a documentação técnica, seção 7.5.4).
-- =============================================================================


-- 1) Versão atual da bula no catálogo
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS bula_path TEXT,                       -- caminho no bucket "bulas"
  ADD COLUMN IF NOT EXISTS bula_sha256 TEXT,                     -- detecta mudança de conteúdo
  ADD COLUMN IF NOT EXISTS bula_atualizada_em TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS bula_origem TEXT,                     -- 'admin', 'script', 'anvisa'…
  ADD COLUMN IF NOT EXISTS bula_reanalisar BOOLEAN NOT NULL DEFAULT false; -- bula mudou e a análise ainda não foi refeita

-- 2) Histórico de versões (auditoria: o que mudou e quando)
CREATE TABLE IF NOT EXISTS public.bula_versoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL,
  bula_path TEXT NOT NULL,
  bula_sha256 TEXT NOT NULL,
  origem TEXT NOT NULL,
  enviado_por UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bula_versoes_med ON public.bula_versoes (medication_id, created_at DESC);
ALTER TABLE public.bula_versoes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view bula history" ON public.bula_versoes;
CREATE POLICY "Admins can view bula history" ON public.bula_versoes FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) Bucket público de leitura (bulas são documentos públicos); só admin envia/apaga
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('bulas', 'bulas', true, 20971520, ARRAY['application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520, allowed_mime_types = ARRAY['application/pdf'];

DROP POLICY IF EXISTS "Admins upload bulas" ON storage.objects;
CREATE POLICY "Admins upload bulas" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'bulas' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins update bulas" ON storage.objects;
CREATE POLICY "Admins update bulas" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'bulas' AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS "Admins delete bulas" ON storage.objects;
CREATE POLICY "Admins delete bulas" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'bulas' AND public.has_role(auth.uid(), 'admin'));

-- 4) Registrar nova versão (admin). Se o conteúdo for igual ao atual, não muda nada.
CREATE OR REPLACE FUNCTION public.admin_set_bula(_med_id UUID, _path TEXT, _sha256 TEXT, _origem TEXT DEFAULT 'admin')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  atual TEXT;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;
  SELECT bula_sha256 INTO atual FROM public.medications WHERE id = _med_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Medicamento não encontrado' USING ERRCODE = 'P0002';
  END IF;
  IF atual = _sha256 THEN
    RETURN 'igual';
  END IF;
  UPDATE public.medications
     SET bula_path = _path,
         bula_sha256 = _sha256,
         bula_atualizada_em = now(),
         bula_origem = _origem,
         -- Enviada pelo admin: não há garantia de que é a mesma versão já analisada.
         -- Fica "Atenção" até alguém conferir a composição e marcar como analisada.
         bula_reanalisar = true
   WHERE id = _med_id;
  INSERT INTO public.bula_versoes (medication_id, bula_path, bula_sha256, origem, enviado_por)
  VALUES (_med_id, _path, _sha256, _origem, auth.uid());
  RETURN CASE WHEN atual IS NULL THEN 'primeira' ELSE 'atualizada' END;
END;
$$;

-- 5) Análise refeita: libera a classificação normal
CREATE OR REPLACE FUNCTION public.admin_mark_bula_analisada(_med_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Acesso restrito a administradores' USING ERRCODE = '42501';
  END IF;
  UPDATE public.medications SET bula_reanalisar = false WHERE id = _med_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_bula(UUID, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_mark_bula_analisada(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_bula(UUID, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_mark_bula_analisada(UUID) TO authenticated;
