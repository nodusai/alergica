import { supabase } from "@/integrations/supabase/client";
import { selectionFromRow, selectionToText, type AllergySelection } from "@/lib/allergens";

export { selectionFromRow };

export type ProfileSummary = {
  full_name: string | null;
  profile_type: string | null;
  gender: string | null;
};

/** Dados mínimos do perfil para o menu lateral. */
export const getProfileSummary = async (userId: string): Promise<ProfileSummary | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("full_name, profile_type, gender" as "full_name, profile_type")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileSummary | null) ?? null;
};

/** Alergias salvas no perfil (listas marcadas + "Outros"). */
export const getAllergySelection = async (userId: string): Promise<AllergySelection> => {
  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return selectionFromRow(data as Record<string, unknown> | null);
};

const isMissingColumn = (code?: string) => code === "42703" || code === "PGRST204";

/**
 * Grava as alergias. Se o banco ainda não tiver as colunas novas, grava tudo como texto
 * em `allergy_info` (reconhecido de volta na leitura) e devolve `fallback: true`.
 */
export const saveAllergySelection = async (
  userId: string,
  sel: AllergySelection,
): Promise<{ error: { code?: string; message: string } | null; fallback: boolean }> => {
  const { error } = await supabase
    .from("profiles")
    .update({ food_allergies: sel.food, drug_allergies: sel.drug, allergy_info: sel.other.trim() } as never)
    .eq("user_id", userId);
  if (!error) return { error: null, fallback: false };
  if (!isMissingColumn(error.code)) return { error, fallback: false };
  const { error: e2 } = await supabase
    .from("profiles")
    .update({ allergy_info: selectionToText(sel) } as never)
    .eq("user_id", userId);
  return { error: e2, fallback: true };
};
