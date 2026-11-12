-- Alergias do perfil organizadas por tipo (listas do cadastro e do perfil).
-- food_allergies / drug_allergies guardam os ids do catálogo de src/lib/allergens.ts
-- (ex.: 'leite', 'ovo', 'penicilinas'); allergy_info passa a ser o campo "Outros" (texto livre).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS food_allergies TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS drug_allergies TEXT[] NOT NULL DEFAULT '{}';

-- Consulta "quais usuários têm alergia X" (organização por alergia)
CREATE INDEX IF NOT EXISTS idx_profiles_food_allergies ON public.profiles USING GIN (food_allergies);
CREATE INDEX IF NOT EXISTS idx_profiles_drug_allergies ON public.profiles USING GIN (drug_allergies);
