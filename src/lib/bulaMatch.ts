/**
 * Identifica a qual remédio do catálogo pertence uma bula em PDF, pelo TEXTO da bula
 * (nome comercial, laboratório e princípios ativos). O nome do arquivo baixado do
 * Bulário não ajuda (costuma ser um número), então só conta como desempate.
 *
 * Princípio: na dúvida, não escolhe. Só "alta" confiança vem pré-marcada; o resto
 * o administrador confirma.
 */
import { normalizeText } from "./allergens";

export type CatalogEntry = {
  id: string;
  nome_principal: string;
  nome_alternativo: string | null;
  /** Chaves canônicas dos princípios ativos (activeKeysOf), ex.: "cafeina + paracetamol" */
  actives: string[];
  bula_sha256?: string | null;
};

export type Confidence = "igual" | "alta" | "media" | "baixa";

export type Candidate = { id: string; score: number; reasons: string[] };

export type MatchResult = {
  confidence: Confidence;
  /** Melhores candidatos, do mais provável para o menos */
  candidates: Candidate[];
  /** Pré-selecionados: o produto mais provável e as outras apresentações dele (mesmo nome e laboratório) */
  selected: string[];
};

/** Palavras que descrevem forma/dose e não identificam o produto */
const GENERIC = new Set(
  (
    "solucao fisiologica injetavel oral comprimido comprimidos revestido revestidos capsula capsulas gotas xarope " +
    "suspensao creme pomada gel spray po para de da do das dos com e em sodio sodico sodica cloridrato infantil adulto " +
    "pediatrico uso mg ml mcg ui liberacao prolongada efervescente mastigavel dispersivel granulado sache " +
    "frasco ampola bisnaga envelope generico similar"
  ).split(" "),
);

/** Palavras de razão social que não distinguem laboratórios */
const CORPORATE = new Set(
  (
    "ltda sa s/a ltd eireli me epp industria industrias farmaceutica farmaceuticas farmaceutico farmaceuticos " +
    "laboratorio laboratorios quimica quimico comercio brasil brasileira do de da dos das e ind com prod produtos " +
    "importacao exportacao participacoes grupo cia companhia"
  ).split(" "),
);

const words = (s: string) => normalizeText(s).split(/[^a-z0-9]+/).filter(Boolean);

export const nameTokens = (nome: string) =>
  words(nome.replace(/\(.*?\)/g, " ")).filter((w) => w.length >= 3 && !/\d/.test(w) && !GENERIC.has(w));

export const labTokens = (lab: string | null) =>
  words(lab ?? "").filter((w) => w.length >= 3 && !/\d/.test(w) && !CORPORATE.has(w));

const fraction = (tokens: string[], set: Set<string>) =>
  tokens.length ? tokens.filter((t) => set.has(t)).length / tokens.length : 0;

/** Chave de "mesmo produto": nome + laboratório (apresentações diferentes do mesmo remédio) */
const productKey = (e: CatalogEntry) => `${nameTokens(e.nome_principal).join(" ")}|${labTokens(e.nome_alternativo).join(" ")}`;

/**
 * @param fullText texto de todas as páginas lidas
 * @param headText texto da 1ª página (onde fica o nome do produto)
 */
export const matchBula = (
  fullText: string,
  headText: string,
  fileName: string,
  sha256: string,
  catalog: CatalogEntry[],
): MatchResult => {
  // Mesmo arquivo já guardado: identificação exata
  const same = catalog.filter((e) => e.bula_sha256 && e.bula_sha256 === sha256);
  if (same.length) {
    return {
      confidence: "igual",
      candidates: same.map((e) => ({ id: e.id, score: 100, reasons: ["mesmo arquivo já guardado"] })),
      selected: same.map((e) => e.id),
    };
  }

  const all = new Set(words(fullText));
  const head = new Set(words(headText));
  const file = new Set(words(fileName));
  // Bula de genérico: o nome do produto É o princípio ativo
  const genericBula = head.has("generico");

  const scored: Candidate[] = [];
  for (const e of catalog) {
    const name = nameTokens(e.nome_principal);
    if (!name.length) continue;
    // Nome igual ao princípio ativo ("dipirona") aparece em TODA bula desse ativo, inclusive
    // de marcas (Novalgina). Só vale peso cheio quando a bula se declara genérico.
    const activeWords = new Set(e.actives.flatMap((k) => words(k)));
    const isGenericName = name.every((t) => activeWords.has(t));
    const nameWeight = isGenericName && !genericBula ? 0.5 : 1;
    const nameHead = fraction(name, head) * nameWeight;
    const nameAll = fraction(name, all) * nameWeight;
    // Sem o nome no texto não é candidato (evita casar só pelo laboratório)
    if (nameAll === 0) continue;

    const reasons: string[] = [];
    let score = 45 * nameHead + 15 * Math.max(0, nameAll - nameHead);
    if (nameHead >= nameWeight) reasons.push("nome na capa");
    else if (nameAll >= nameWeight) reasons.push("nome no texto");

    const lab = labTokens(e.nome_alternativo);
    const labFrac = fraction(lab, all);
    score += 30 * labFrac;
    if (labFrac === 1) reasons.push("laboratório");

    const activeParts = e.actives.map((k) => k.split(/\s*\+\s*/).flatMap(words));
    const actFrac = activeParts.length
      ? activeParts.reduce((acc, parts) => acc + fraction(parts, all), 0) / activeParts.length
      : 0;
    score += 20 * actFrac;
    if (actFrac === 1) reasons.push("princípio ativo");

    if (name.some((t) => file.has(t))) {
      score += 5;
      reasons.push("nome do arquivo");
    }
    scored.push({ id: e.id, score: Math.round(Math.min(score, 99)), reasons });
  }

  scored.sort((a, b) => b.score - a.score);
  const candidates = scored.slice(0, 8);
  if (!candidates.length) return { confidence: "baixa", candidates, selected: [] };

  const byId = new Map(catalog.map((e) => [e.id, e]));
  const topKey = productKey(byId.get(candidates[0].id)!);
  const group = candidates.filter((c) => c.score === candidates[0].score && productKey(byId.get(c.id)!) === topKey);
  const rival = candidates.find((c) => !group.includes(c));
  const top = candidates[0].score;
  const margin = rival ? top - rival.score : top;

  const confidence: Confidence = top >= 75 && margin >= 15 ? "alta" : top >= 50 ? "media" : "baixa";
  return { confidence, candidates, selected: confidence === "alta" ? group.map((c) => c.id) : [] };
};
