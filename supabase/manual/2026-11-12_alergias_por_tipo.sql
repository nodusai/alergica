-- =============================================================================
-- AlerGica — listas de alergias no perfil (12/11/2026)
--
-- Cria as colunas usadas pelas listas "Alergias alimentares" e "Alergias a
-- medicamentos" do cadastro e do perfil. Pode ser executado mais de uma vez com
-- segurança (não apaga nem altera dados existentes).
--
-- Como usar: Supabase → SQL Editor → New query → colar tudo → Run.
--
-- Antes de rodar, o app continua funcionando: as alergias marcadas são gravadas
-- como texto em allergy_info e reconhecidas de volta na leitura. Depois de rodar,
-- cada perfil passa a gravar nas colunas novas na próxima vez que for salvo.
-- =============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allergy_info TEXT,
  ADD COLUMN IF NOT EXISTS food_allergies TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS drug_allergies TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_profiles_food_allergies ON public.profiles USING GIN (food_allergies);
CREATE INDEX IF NOT EXISTS idx_profiles_drug_allergies ON public.profiles USING GIN (drug_allergies);

-- Conferência: deve listar as duas colunas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
  AND column_name IN ('food_allergies', 'drug_allergies');
