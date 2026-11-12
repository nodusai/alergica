import { supabase } from "@/integrations/supabase/client";
import { assessMedication, catalogMilkRisk } from "@/lib/medicationRisk";
import type { UserAllergies } from "@/lib/allergens";

export type MedRow = {
  id: string;
  nome_principal: string;
  nome_alternativo: string | null;
  nome_completo: string | null;
  tem_risco_aplv: boolean | null;
  nivel_alerta: string | null;
  avisos: unknown;
  access_count: number;
  composicao: string | null;
  /** Bula trocada e ainda não reanalisada (ausente enquanto o banco não tiver a coluna) */
  bula_reanalisar?: boolean | null;
};

export type MedicationDetail = MedRow & {
  composicao: string | null;
  termos_encontrados: string | null;
  avisos: string | null;
  detalhes_criticos: string | null;
  detalhes_atencao: string | null;
  arquivo_url: string | null;
  data_extracao: string | null;
  /** Cópia da bula no Storage (bucket "bulas") */
  bula_path?: string | null;
  bula_sha256?: string | null;
  bula_atualizada_em?: string | null;
  bula_origem?: string | null;
};

const LIST_SELECT =
  "id, nome_principal, nome_alternativo, nome_completo, tem_risco_aplv, nivel_alerta, avisos, access_count, composicao";

/**
 * As listas também leem `bula_reanalisar` (bula trocada → "Atenção"). Enquanto o banco não
 * tiver a coluna (script supabase/manual/2026-11-12_bulas_storage.sql), a consulta falha com
 * "coluna inexistente"; nesse caso repete sem ela e não tenta de novo nesta sessão.
 */
let hasBulaColumns = true;
const listSelect = () =>
  (hasBulaColumns ? `${LIST_SELECT}, bula_reanalisar` : LIST_SELECT) as typeof LIST_SELECT;
const isMissingColumn = (e: { code?: string } | null) => e?.code === "42703" || e?.code === "PGRST204";

/** Executa a consulta; se faltar a coluna da bula, repete sem ela */
const withListSelect = async <R extends { error: { code?: string } | null }>(run: () => PromiseLike<R>): Promise<R> => {
  const r = await run();
  if (r.error && hasBulaColumns && isMissingColumn(r.error)) {
    hasBulaColumns = false;
    return run();
  }
  return r;
};

/** Classificação do catálogo para leite (APLV). Para o perfil do usuário use `assessMedication`. */
export const medToRisk = catalogMilkRisk;

/** Parse a JSON-array-in-text field into a clean string list. */
export const parseTextField = (raw: unknown): string[] => {
  if (raw === null || raw === undefined || raw === "") return [];
  if (Array.isArray(raw)) return raw.map((s) => String(s).trim()).filter(Boolean);
  if (typeof raw === "object") return Object.values(raw).map((s) => String(s).trim()).filter(Boolean);
  const trimmed = String(raw).trim();
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
  const { data, error } = await withListSelect(() =>
    supabase.from("medications").select(listSelect()).order("access_count", { ascending: false }).limit(6),
  );
  if (error) throw error;
  return data ?? [];
};

export const getRecentMedications = async (limit = 10): Promise<MedRow[]> => {
  const { data, error } = await withListSelect(() =>
    supabase.from("medications").select(listSelect()).order("nome_principal", { ascending: true }).limit(limit),
  );
  if (error) throw error;
  return data ?? [];
};

/** Quantidade de remédios por página no módulo Remédios */
export const MEDS_PAGE_SIZE = 30;

/** Uma página do catálogo em ordem alfabética, com o total de registros. */
export const getMedicationsPage = async (
  page: number,
  pageSize = MEDS_PAGE_SIZE,
): Promise<{ items: MedRow[]; total: number }> => {
  const from = (page - 1) * pageSize;
  const { data, error, count } = await withListSelect(() =>
    supabase
      .from("medications")
      .select(listSelect(), { count: "exact" })
      .order("nome_principal", { ascending: true })
      // desempate estável: nomes repetidos não "pulam" entre páginas
      .order("id", { ascending: true })
      .range(from, from + pageSize - 1),
  );
  if (error) throw error;
  return { items: data ?? [], total: count ?? 0 };
};

/** O PostgREST devolve no máximo 1000 linhas por chamada; busca em lotes até acabar. */
const FETCH_BATCH = 1000;

/**
 * Remédios de uma classificação, para as alergias do usuário.
 * Sem alergias personalizadas (só APLV), o banco já filtra por `tem_risco_aplv`.
 * Com outras alergias, a classificação depende da composição: busca o catálogo inteiro
 * (em lotes, com cache na sessão) e aplica a mesma regra do detalhe (`assessMedication`).
 */
export const getMedicationsByRisk = async (
  risk: "safe" | "caution" | "risk",
  allergies: UserAllergies,
  personalized: boolean,
): Promise<MedRow[]> => {
  const rows = personalized ? await getWholeCatalog() : await fetchAllBatches(milkOnlyQuery(risk));
  return rows.filter((m) => assessMedication(m, allergies).level === risk);
};

const milkOnlyQuery = (risk: "safe" | "caution" | "risk") => () => {
  const query = supabase
    .from("medications")
    .select(listSelect())
    .order("nome_principal", { ascending: true })
    .order("id", { ascending: true });
  if (risk === "safe") return query.eq("tem_risco_aplv", false);
  if (risk === "risk") return query.eq("tem_risco_aplv", true);
  // caution: "AMARELO" é o valor real no banco para atenção;
  // também captura via avisos (🟡/ATENÇÃO) e nivel_alerta com palavras-chave
  return query.or(
    "nivel_alerta.ilike.%amarelo%,nivel_alerta.ilike.%aten%,nivel_alerta.ilike.%cuidado%,avisos.ilike.%aten%,avisos.ilike.%🟡%,tem_risco_aplv.is.null"
  );
};

const fetchAllBatches = async (build: () => ReturnType<ReturnType<typeof milkOnlyQuery>>): Promise<MedRow[]> => {
  const rows: MedRow[] = [];
  for (let from = 0; ; from += FETCH_BATCH) {
    const { data, error } = await withListSelect(() => build().range(from, from + FETCH_BATCH - 1));
    if (error) throw error;
    rows.push(...((data ?? []) as MedRow[]));
    if (!data || data.length < FETCH_BATCH) break;
  }
  return rows;
};

let catalogCache: { at: number; rows: Promise<MedRow[]> } | null = null;
const CATALOG_TTL = 10 * 60 * 1000;

/** Catálogo inteiro em ordem alfabética (cache de 10 min na sessão) */
const getWholeCatalog = () => {
  if (!catalogCache || Date.now() - catalogCache.at > CATALOG_TTL) {
    const rows = fetchAllBatches(() =>
      supabase
        .from("medications")
        .select(listSelect())
        .order("nome_principal", { ascending: true })
        .order("id", { ascending: true }),
    );
    rows.catch(() => (catalogCache = null));
    catalogCache = { at: Date.now(), rows };
  }
  return catalogCache.rows;
};

export const searchMedications = async (q: string, limit = 12): Promise<MedRow[]> => {
  const { data, error } = await withListSelect(() =>
    supabase
      .from("medications")
      .select(listSelect())
      .or(`nome_principal.ilike.%${q}%,nome_alternativo.ilike.%${q}%,nome_completo.ilike.%${q}%`)
      .limit(limit),
  );
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

// ---------------------------------------------------------------------------
// Alternativas seguras: mesmos princípios ativos, sem derivados do leite
// ---------------------------------------------------------------------------

const normalizeName = (s: string) => {
  let out = s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[®™]/g, "");
  // Remove parênteses, inclusive aninhados: "(5,20 mg (equivale a 5 mg))"
  for (let prev = ""; prev !== out; ) {
    prev = out;
    out = out.replace(/\([^()]*\)/g, " ");
  }
  return out
    .replace(/\d+[.,]?\d*\s*(mg|g|ml|mcg|ui|%)(\/\s*\w+)?/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

/** Sais, hidratação e formas farmacêuticas: não mudam o princípio ativo */
const NOISE_WORDS = new RegExp(
  "\\b(" +
    [
      "cloridrato", "dicloridrato", "bromidrato", "hemifumarato", "fumarato", "maleato", "besilato", "mesilato",
      "succinato", "tartarato", "hemitartarato", "citrato", "acetato", "hiclato", "pamoato", "valerato",
      "oxalato", "malato", "fosfato", "propionato", "dipropionato", "furoato", "xinafoato", "bissulfato", "nitrato",
      "sodic[oa]", "potassic[oa]", "calcic[oa]", "magnesic[oa]", "dissodic[oa]",
      "(?:mono|di|tri|sesqui|hemi)?-?h?idratad[oa]", "anidr[oa]",
      "comprimidos?", "revestidos?", "capsulas?", "gotas", "solucao", "oral", "xarope", "suspensao", "injetavel",
      "po", "para", "liberacao", "prolongada", "retard", "xr", "sr", "ap",
    ].join("|") +
    ")\\b",
  "g",
);

const canonicalIngredient = (s: string) =>
  s
    // Prefixo de laboratório público: "furp-metoclopramida", "lfm-ziprasidona"
    .replace(/^[a-z]{2,6}-(?=[a-z]{4,})/, "")
    .replace(NOISE_WORDS, " ")
    .replace(/^\s*de\s+|\s+de\s*$/g, " ")
    .replace(/\s+de\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Conjunto de princípios ativos em forma canônica, ex.: "cafeina + paracetamol" */
const activeKey = (s: string) =>
  [
    ...new Set(
      normalizeName(s)
        .split(/\s*\+\s*|\s*;\s*|\s*,\s*|\s+e\s+/)
        .map(canonicalIngredient)
        .filter(Boolean),
    ),
  ]
    .sort()
    .join(" + ");

/** Princípios ativos do medicamento: do nome (genéricos) ou do início da composição (marcas). */
export const activeKeysOf = (med: Pick<MedicationDetail, "nome_principal" | "composicao">): string[] => {
  const keys = new Set<string>();
  if (med.nome_principal) keys.add(activeKey(med.nome_principal));
  const ativos = med.composicao?.split(/\.\s*Excipientes?:/i)[0]?.trim();
  if (ativos) keys.add(activeKey(ativos));
  return [...keys].filter(Boolean);
};

/** Padrão ILIKE que ignora acentos: troca vogais/ç por "_" (curinga de 1 caractere) */
const accentInsensitive = (word: string) => word.replace(/[aeiouc]/g, "_");

export type SafeAlternative = Pick<MedRow, "id" | "nome_principal" | "nome_alternativo" | "nome_completo">;

/**
 * Busca medicamentos seguros (sem leite) com exatamente os mesmos princípios ativos.
 * Retorna no máximo um por fabricante, priorizando os mais consultados.
 */
export const getSafeAlternatives = async (
  med: Pick<MedicationDetail, "id" | "nome_principal" | "composicao">,
  limit = 6,
  /** Alergias do perfil: só aceita alternativas que a regra do usuário classifica como seguras */
  allergies?: UserAllergies,
): Promise<SafeAlternative[]> => {
  const keys = activeKeysOf(med);
  if (keys.length === 0) return [];

  // Busca pela palavra mais longa de cada chave (a mais específica); a comparação exata é feita depois.
  // Usa palavra solta porque o banco pode ter "de", sais etc. entre as palavras.
  const terms = [
    ...new Set(keys.map((k) => k.split(/[\s+]+/).filter(Boolean).sort((a, b) => b.length - a.length)[0])),
  ].filter((t) => t && t.length >= 4);
  const orFilter = terms
    .flatMap((t) => {
      const p = `%${accentInsensitive(t)}%`;
      return [`nome_principal.ilike.${p}`, `nome_completo.ilike.${p}`, `composicao.ilike.${p}`];
    })
    .join(",");

  const { data, error } = await withListSelect(() => supabase
    .from("medications")
    .select(listSelect())
    .eq("tem_risco_aplv", false)
    .neq("id", med.id)
    .or(orFilter)
    .order("access_count", { ascending: false })
    .limit(300));
  if (error) throw error;

  const wanted = new Set(keys);
  const seenLabs = new Set<string>();
  const result: SafeAlternative[] = [];
  for (const row of data ?? []) {
    const rowKeys = activeKeysOf(row as MedicationDetail);
    if (!rowKeys.some((k) => wanted.has(k))) continue;
    // Mesma regra do detalhe: alternativa só se for "Seguro" para o perfil (nunca "Atenção")
    if (allergies && assessMedication(row, allergies).level !== "safe") continue;
    // Fabricante normalizado: ignora caixa, acentos, pontuação e sufixos (Ltda., S.A.)
    const lab = normalizeName(row.nome_alternativo ?? row.id)
      .replace(/[^a-z0-9 ]/g, " ")
      .replace(/\b(ltda|s ?a|eireli|me|epp)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (seenLabs.has(lab)) continue;
    seenLabs.add(lab);
    result.push({
      id: row.id,
      nome_principal: row.nome_principal ?? "",
      nome_alternativo: row.nome_alternativo,
      nome_completo: row.nome_completo,
    });
    if (result.length >= limit) break;
  }
  return result;
};

export const recordMedicationView = async (id: string) => {
  try {
    await (supabase.rpc as any)("increment_medication_access", { med_id: id });
  } catch {
    // fire-and-forget
  }
};
