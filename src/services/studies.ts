/**
 * Estudos científicos recentes sobre APLV, fórmulas e medicamentos.
 * Fonte: Europe PMC (indexa o PubMed) — API pública, sem chave, com CORS liberado.
 */

export type StudyCategory = "formulas" | "medicamentos";

export type Study = {
  id: string;
  /** Título em português (tradução automática) ou o original, se a tradução falhar */
  title: string;
  originalTitle: string;
  translated: boolean;
  journal: string;
  publishedAt: string | null;
  url: string;
  category: StudyCategory;
};

const EUROPE_PMC = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";

const MILK_ALLERGY =
  '(TITLE:"milk allergy" OR TITLE:"milk protein allergy" OR TITLE:"milk allergic" OR TITLE:"milk-allergic")';

const QUERIES: { category: StudyCategory; query: string; limit: number }[] = [
  {
    category: "formulas",
    query: `${MILK_ALLERGY} AND (TITLE:formula OR TITLE:formulas OR TITLE:hydrolysate OR TITLE:hydrolyzed OR TITLE:hydrolysed OR TITLE:"amino acid") AND PUB_YEAR:[2024 TO 2030]`,
    limit: 7,
  },
  {
    category: "medicamentos",
    query: `${MILK_ALLERGY} AND (TITLE:medication OR TITLE:medications OR TITLE:medicine OR TITLE:medicines OR TITLE:drug OR TITLE:drugs OR TITLE:excipient OR TITLE:excipients OR TITLE:vaccine OR TITLE:vaccines OR TITLE:inhaler OR TITLE:inhalers) AND PUB_YEAR:[2019 TO 2030]`,
    limit: 5,
  },
];

type EuropePmcResult = {
  id: string;
  source: string;
  pmid?: string;
  doi?: string;
  title: string;
  journalTitle?: string;
  firstPublicationDate?: string;
};

const cleanTitle = (t: string) =>
  t.replace(/<[^>]+>/g, "").replace(/&lt;[^&]+&gt;/g, "").replace(/\s+/g, " ").replace(/^\[|\]\.?$/g, "").trim();

const fetchCategory = async (category: StudyCategory, query: string, limit: number): Promise<Study[]> => {
  const params = new URLSearchParams({
    query: `${query} AND SRC:MED NOT PUB_TYPE:"letter" NOT PUB_TYPE:"comment"`,
    format: "json",
    pageSize: String(limit),
    sort: "P_PDATE_D desc",
    resultType: "lite",
  });
  const res = await fetch(`${EUROPE_PMC}?${params}`);
  if (!res.ok) throw new Error(`Europe PMC ${res.status}`);
  const data = await res.json();
  const results: EuropePmcResult[] = data?.resultList?.result ?? [];

  return results.map((r) => ({
    id: `${r.source}:${r.id}`,
    title: cleanTitle(r.title),
    originalTitle: cleanTitle(r.title),
    translated: false,
    journal: r.journalTitle ?? "",
    publishedAt: r.firstPublicationDate ?? null,
    url: r.pmid
      ? `https://pubmed.ncbi.nlm.nih.gov/${r.pmid}/`
      : r.doi
        ? `https://doi.org/${r.doi}`
        : `https://europepmc.org/article/${r.source}/${r.id}`,
    category,
  }));
};

// ---------------------------------------------------------------------------
// Tradução dos títulos para português (MyMemory — API gratuita, sem chave, com CORS).
// As traduções ficam em cache no navegador para não repetir chamadas.
// ---------------------------------------------------------------------------

const TRANSLATE_URL = "https://api.mymemory.translated.net/get";
const CACHE_KEY = "alergica:study-title-pt";

const readCache = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) ?? "{}");
  } catch {
    return {};
  }
};

const writeCache = (cache: Record<string, string>) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* armazenamento indisponível — segue sem cache */
  }
};

const translateToPt = async (text: string): Promise<string | null> => {
  try {
    const params = new URLSearchParams({ q: text, langpair: "en|pt-BR" });
    // Tempo limite: se a tradução demorar, o título original é exibido
    const res = await fetch(`${TRANSLATE_URL}?${params}`, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const data = await res.json();
    const out: string | undefined = data?.responseData?.translatedText;
    // Quando a cota esgota, a API devolve status != 200 ou um aviso em maiúsculas no lugar da tradução
    if (data?.responseStatus !== 200 || !out || /MYMEMORY WARNING|QUERY LENGTH LIMIT/i.test(out)) return null;
    return out.trim();
  } catch {
    return null;
  }
};

const translateTitles = async (studies: Study[]): Promise<Study[]> => {
  const cache = readCache();
  const pending = studies.filter((s) => !cache[s.id]);

  const results = await Promise.all(pending.map((s) => translateToPt(s.originalTitle)));
  pending.forEach((s, i) => {
    const pt = results[i];
    if (pt) cache[s.id] = pt;
  });

  // Mantém no cache só os estudos atuais
  const current = Object.fromEntries(studies.filter((s) => cache[s.id]).map((s) => [s.id, cache[s.id]]));
  writeCache(current);

  return studies.map((s) =>
    current[s.id] ? { ...s, title: current[s.id], translated: true } : s,
  );
};

/** Retorna estudos recentes sobre fórmulas e medicamentos na APLV, do mais novo para o mais antigo. */
export const getRecentStudies = async (): Promise<Study[]> => {
  const settled = await Promise.allSettled(QUERIES.map((q) => fetchCategory(q.category, q.query, q.limit)));

  const seen = new Set<string>();
  const studies: Study[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    for (const study of s.value) {
      if (seen.has(study.id)) continue;
      seen.add(study.id);
      studies.push(study);
    }
  }

  studies.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));
  return translateTitles(studies);
};
