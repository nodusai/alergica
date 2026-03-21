import { supabase } from "@/integrations/supabase/client";

export type MedRow = {
  id: string;
  nome_principal: string;
  nome_alternativo: string | null;
  nome_completo: string | null;
  tem_risco_aplv: boolean | null;
  nivel_alerta: string | null;
  avisos: unknown;
  access_count: number;
};

export type MedicationDetail = MedRow & {
  composicao: string | null;
  termos_encontrados: string | null;
  avisos: string | null;
  detalhes_criticos: string | null;
  detalhes_atencao: string | null;
  arquivo_url: string | null;
  data_extracao: string | null;
};

const LIST_SELECT =
  "id, nome_principal, nome_alternativo, nome_completo, tem_risco_aplv, nivel_alerta, avisos, access_count";

export const medToRisk = (
  temRisco: boolean | null | undefined,
  nivel: string | null | undefined,
  avisos?: unknown,
): "safe" | "caution" | "risk" => {
  const n = (nivel ?? "").toLowerCase();
  const avStr = Array.isArray(avisos)
    ? (avisos as unknown[]).map(String).join(" ")
    : String(avisos ?? "");
  const av = avStr.toLowerCase();

  if (n.includes("crítico") || n.includes("critico") || n.includes("proibido")) return "risk";
  if (av.includes("crítico") || av.includes("critico") || av.includes("proibido") || av.includes("🔴")) return "risk";
  if (n.includes("atenção") || n.includes("atencao") || n.includes("cuidado")) return "caution";
  if (av.includes("atenção") || av.includes("atencao") || av.includes("cuidado") || av.includes("🟡")) return "caution";
  if (temRisco === true) return "risk";
  if (temRisco === false) return "safe";
  if (n.includes("seguro") || n.includes("liberado")) return "safe";
  return "caution";
};

/** Parse a JSON-array-in-text field into a clean string list. */
export const parseTextField = (raw: unknown): string[] => {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.map((s: unknown) => String(s).trim()).filter(Boolean);
  if (typeof raw !== "string") return [String(raw)];
  const trimmed = raw.trim();
  if (!trimmed) return [];
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.map((s: unknown) => String(s).trim()).filter(Boolean);
    } catch { /* not valid JSON, treat as plain text */ }
  }
  return [trimmed];
};

export const getPopularMedications = async (): Promise<MedRow[]> => {
  const { data, error } = await supabase
    .from("medications")
    .select(LIST_SELECT)
    .order("access_count", { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
};

export const getRecentMedications = async (limit = 10): Promise<MedRow[]> => {
  const { data, error } = await supabase
    .from("medications")
    .select(LIST_SELECT)
    .order("nome_principal", { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
};

export const getMedicationsByRisk = async (
  risk: "safe" | "caution" | "risk"
): Promise<MedRow[]> => {
  let query = supabase
    .from("medications")
    .select(LIST_SELECT)
    .order("nome_principal", { ascending: true });

  if (risk === "safe") {
    query = query.eq("tem_risco_aplv", false);
  } else if (risk === "risk") {
    query = query.eq("tem_risco_aplv", true);
  } else {
    // caution: "AMARELO" é o valor real no banco para atenção;
    // também captura via avisos (🟡/ATENÇÃO) e nivel_alerta com palavras-chave
    query = query.or(
      "nivel_alerta.ilike.%amarelo%,nivel_alerta.ilike.%aten%,nivel_alerta.ilike.%cuidado%,avisos.ilike.%aten%,avisos.ilike.%🟡%,tem_risco_aplv.is.null"
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  // Refinamento client-side para garantir precisão (o avisos pode mudar a classificação)
  return (data ?? []).filter((m) => medToRisk(m.tem_risco_aplv, m.nivel_alerta, m.avisos) === risk);
};

export const searchMedications = async (q: string, limit = 12): Promise<MedRow[]> => {
  const { data, error } = await supabase
    .from("medications")
    .select(LIST_SELECT)
    .or(
      `nome_principal.ilike.%${q}%,nome_alternativo.ilike.%${q}%,nome_completo.ilike.%${q}%`
    )
    .limit(limit);
  if (error) throw error;
  return data ?? [];
};

export const getMedication = async (id: string): Promise<MedicationDetail> => {
  const { data, error } = await supabase
    .from("medications")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as MedicationDetail;
};

export const recordMedicationView = async (id: string) => {
  try {
    await (supabase.rpc as any)("increment_medication_access", { med_id: id });
  } catch {
    // fire-and-forget
  }
};
