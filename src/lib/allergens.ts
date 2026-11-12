/**
 * Catálogo de alergias do AlerGica e reconhecimento do que o usuário informa.
 *
 * O usuário marca alergias em duas listas (10 alimentares e 10 classes de medicamentos)
 * e pode escrever outras em "Outros". O texto livre é ligado aos grupos conhecidos
 * (inclusive grupos que não aparecem nas listas, como opioides ou corantes); o que não
 * for reconhecido vira um termo próprio, procurado exatamente como foi escrito.
 */

export type AllergenKind = "alimento" | "medicamento";

export type AllergenGroup = {
  id: string;
  kind: AllergenKind;
  /** Nome exibido na interface */
  label: string;
  /** Exemplos curtos exibidos na lista de seleção */
  hint?: string;
  /** Aparece nas listas de seleção (as 10 principais de cada tipo) */
  featured: boolean;
  /** O que o usuário pode escrever em "Outros" para indicar esta alergia (sem acento) */
  aliases: string[];
  /** Termos procurados nos ingredientes / princípios ativos (sem acento, minúsculas) */
  terms: string[];
  /**
   * Ingredientes que PODEM vir desta fonte, mas o rótulo/bula não diz a origem
   * (ex.: "lecitina" pode ser de soja ou de ovo). Viram "Atenção", nunca "Seguro".
   * `unless`: complementos que esclarecem a origem ("lecitina de girassol").
   */
  ambiguous?: { term: string; unless: string[] }[];
  /** Classes com possível reação cruzada (viram "Atenção") */
  crossReactive?: string[];
};

const VEGETABLE_ORIGINS = ["de milho", "de mandioca", "de batata", "de arroz", "de girassol", "de canola", "de palma", "de algodao", "de oliva", "de trigo", "de soja"];

export const ALLERGEN_GROUPS: AllergenGroup[] = [
  // ─── Alimentares (10 principais) ───────────────────────────────────────────
  {
    id: "leite",
    kind: "alimento",
    label: "Leite (APLV)",
    hint: "lactose, caseína, soro de leite",
    featured: true,
    aliases: ["aplv", "leite", "lactose", "proteina do leite", "leite de vaca", "caseina", "lacteo", "lacteos", "derivados do leite", "laticinio", "laticinios"],
    terms: [
      "leite", "lactose", "caseina", "caseinato", "lactoalbumina", "lactoglobulina", "soro de leite", "whey",
      "manteiga", "creme de leite", "queijo", "requeijao", "iogurte", "lacteo", "lactea", "lacteos",
      "gordura do leite", "nata", "lactulose",
    ],
  },
  {
    id: "ovo",
    kind: "alimento",
    label: "Ovo",
    hint: "clara, gema, albumina, lisozima",
    featured: true,
    aliases: [
      "ovo", "ovos", "clara", "gema", "albumen", "albumina", "ovoalbumina", "ovomucina", "ovomucoide",
      "ovotransferrina", "lisozima", "lecitina de ovo", "maionese",
    ],
    terms: [
      "ovo", "ovos", "clara de ovo", "gema de ovo", "albumen", "albumina", "ovoalbumina", "ovomucina",
      "ovomucoide", "ovotransferrina", "ovoglobulina", "lisozima", "lecitina de ovo", "maionese",
    ],
    ambiguous: [{ term: "lecitina", unless: ["de soja", "de girassol", "de canola", "vegetal"] }],
  },
  {
    id: "soja",
    kind: "alimento",
    label: "Soja",
    hint: "lecitina de soja, proteína de soja",
    featured: true,
    aliases: ["soja", "lecitina de soja", "proteina de soja", "tofu"],
    terms: ["soja", "lecitina de soja", "proteina de soja", "proteina texturizada", "tofu", "misso", "shoyu"],
    ambiguous: [
      { term: "lecitina", unless: ["de ovo", "de girassol", "de canola"] },
      { term: "oleo vegetal", unless: VEGETABLE_ORIGINS.filter((o) => o !== "de soja") },
      { term: "proteina vegetal", unless: ["de ervilha", "de arroz"] },
    ],
  },
  {
    id: "gluten",
    kind: "alimento",
    label: "Trigo / glúten",
    hint: "trigo, cevada, centeio, aveia, malte",
    featured: true,
    aliases: ["gluten", "trigo", "doenca celiaca", "celiaca", "celiaco", "cevada", "centeio", "aveia", "malte"],
    terms: [
      "gluten", "trigo", "farinha de trigo", "cevada", "centeio", "aveia", "malte", "extrato de malte",
      "semolina", "triticale", "espelta", "seitan", "amido de trigo",
    ],
    ambiguous: [
      { term: "amido", unless: VEGETABLE_ORIGINS.filter((o) => o !== "de trigo").concat(["glicolato", "pregelatinizado de milho"]) },
      { term: "maltodextrina", unless: ["de milho", "de mandioca"] },
      { term: "dextrina", unless: ["de milho", "de mandioca", "ciclodextrina"] },
    ],
  },
  {
    id: "amendoim",
    kind: "alimento",
    label: "Amendoim",
    featured: true,
    aliases: ["amendoim", "amendoins"],
    terms: ["amendoim", "amendoins", "pasta de amendoim", "oleo de amendoim", "arachis"],
    ambiguous: [{ term: "oleo vegetal", unless: VEGETABLE_ORIGINS }],
  },
  {
    id: "castanhas",
    kind: "alimento",
    label: "Castanhas e nozes",
    hint: "caju, pará, amêndoa, avelã, nozes",
    featured: true,
    aliases: [
      "castanha", "castanhas", "nozes", "noz", "oleaginosas", "amendoa", "amendoas", "avela", "avelas",
      "pistache", "macadamia", "caju", "pecan",
    ],
    terms: [
      "castanha", "castanhas", "castanha-de-caju", "castanha de caju", "castanha-do-para", "castanha do para",
      "nozes", "noz", "amendoa", "amendoas", "avela", "avelas", "pistache", "macadamia", "pecan", "pinoli",
    ],
    ambiguous: [{ term: "oleo vegetal", unless: VEGETABLE_ORIGINS }],
  },
  {
    id: "peixe",
    kind: "alimento",
    label: "Peixe",
    featured: true,
    aliases: ["peixe", "peixes", "bacalhau", "atum", "sardinha", "salmao", "oleo de peixe"],
    terms: ["peixe", "peixes", "bacalhau", "atum", "sardinha", "salmao", "anchova", "oleo de peixe", "gelatina de peixe"],
    ambiguous: [
      { term: "gelatina", unless: ["bovina", "suina"] },
      { term: "omega 3", unless: ["de linhaca", "de chia", "de algas"] },
    ],
  },
  {
    id: "crustaceos",
    kind: "alimento",
    label: "Crustáceos e frutos do mar",
    hint: "camarão, lagosta, caranguejo",
    featured: true,
    aliases: ["crustaceo", "crustaceos", "camarao", "lagosta", "caranguejo", "siri", "frutos do mar", "marisco", "mariscos"],
    terms: ["crustaceo", "crustaceos", "camarao", "lagosta", "caranguejo", "siri", "frutos do mar", "marisco", "mariscos", "quitosana"],
    ambiguous: [{ term: "glucosamina", unless: ["vegetal"] }],
  },
  {
    id: "gergelim",
    kind: "alimento",
    label: "Gergelim",
    featured: true,
    aliases: ["gergelim", "sesamo", "tahine", "tahini"],
    terms: ["gergelim", "sesamo", "tahine", "tahini", "oleo de gergelim"],
    ambiguous: [{ term: "oleo vegetal", unless: VEGETABLE_ORIGINS }],
  },
  {
    id: "milho",
    kind: "alimento",
    label: "Milho",
    hint: "amido de milho, fubá",
    featured: true,
    aliases: ["milho", "amido de milho", "maisena", "fuba"],
    terms: ["milho", "amido de milho", "maisena", "fuba", "xarope de milho", "zeina", "pregelatinizado de milho"],
    ambiguous: [
      { term: "amido", unless: VEGETABLE_ORIGINS.filter((o) => o !== "de milho") },
      { term: "maltodextrina", unless: ["de mandioca", "de trigo"] },
      { term: "dextrose", unless: ["de mandioca", "de trigo"] },
    ],
  },
  // ─── Alimentares reconhecidas só pelo texto ("Outros") ────────────────────
  {
    id: "corantes",
    kind: "alimento",
    label: "Corantes",
    featured: false,
    aliases: ["corante", "corantes", "tartrazina", "amarelo tartrazina"],
    terms: ["corante", "corantes", "tartrazina", "amarelo crepusculo", "vermelho 40", "eritrosina", "amaranto"],
  },
  {
    id: "latex",
    kind: "alimento",
    label: "Látex",
    featured: false,
    aliases: ["latex", "borracha natural"],
    terms: ["latex", "borracha natural"],
  },

  // ─── Medicamentos (10 classes que mais causam alergia) ─────────────────────
  {
    id: "penicilinas",
    kind: "medicamento",
    label: "Penicilinas",
    hint: "amoxicilina, ampicilina, Benzetacil",
    featured: true,
    aliases: ["penicilina", "penicilinas", "amoxicilina", "ampicilina", "benzetacil", "amoxil", "clavulanato", "betalactamico", "betalactamicos", "beta-lactamicos"],
    terms: ["penicilina", "benzilpenicilina", "fenoximetilpenicilina", "amoxicilina", "ampicilina", "oxacilina", "piperacilina", "dicloxacilina", "benzetacil"],
    crossReactive: ["cefalosporinas"],
  },
  {
    id: "cefalosporinas",
    kind: "medicamento",
    label: "Cefalosporinas",
    hint: "cefalexina, ceftriaxona",
    featured: true,
    aliases: ["cefalosporina", "cefalosporinas", "cefalexina", "ceftriaxona", "cefadroxila", "keflex"],
    terms: ["cefalexina", "cefadroxila", "cefaclor", "cefuroxima", "ceftriaxona", "cefazolina", "cefepima", "cefotaxima", "ceftazidima", "cefalotina", "cefoxitina", "cefprozila", "cefixima"],
    crossReactive: ["penicilinas"],
  },
  {
    id: "sulfas",
    kind: "medicamento",
    label: "Sulfas",
    hint: "sulfametoxazol (Bactrim)",
    featured: true,
    aliases: ["sulfa", "sulfas", "sulfonamida", "sulfonamidas", "sulfametoxazol", "bactrim"],
    terms: ["sulfametoxazol", "sulfadiazina", "sulfassalazina", "sulfacetamida", "sulfadoxina"],
  },
  {
    id: "aines",
    kind: "medicamento",
    label: "Anti-inflamatórios",
    hint: "ibuprofeno, diclofenaco, nimesulida",
    featured: true,
    aliases: ["anti-inflamatorio", "anti-inflamatorios", "antiinflamatorio", "antiinflamatorios", "aine", "aines", "ibuprofeno", "diclofenaco", "nimesulida", "cetoprofeno", "naproxeno"],
    terms: [
      "ibuprofeno", "dexibuprofeno", "diclofenaco", "nimesulida", "cetoprofeno", "naproxeno", "piroxicam", "meloxicam",
      "tenoxicam", "celecoxibe", "etoricoxibe", "indometacina", "acido mefenamico", "aceclofenaco", "cetorolaco",
    ],
    crossReactive: ["aas", "dipirona"],
  },
  {
    id: "aas",
    kind: "medicamento",
    label: "AAS (ácido acetilsalicílico)",
    hint: "Aspirina, AAS",
    featured: true,
    aliases: ["aas", "aspirina", "acido acetilsalicilico", "salicilato", "salicilatos"],
    terms: ["acido acetilsalicilico", "aspirina", "salicilato"],
    crossReactive: ["aines", "dipirona"],
  },
  {
    id: "dipirona",
    kind: "medicamento",
    label: "Dipirona",
    hint: "metamizol, Novalgina",
    featured: true,
    aliases: ["dipirona", "metamizol", "novalgina"],
    terms: ["dipirona", "metamizol"],
    crossReactive: ["aines", "aas"],
  },
  {
    id: "paracetamol",
    kind: "medicamento",
    label: "Paracetamol",
    hint: "Tylenol, acetaminofeno",
    featured: true,
    aliases: ["paracetamol", "acetaminofeno", "acetaminofen", "tylenol"],
    terms: ["paracetamol", "acetaminofeno"],
  },
  {
    id: "macrolideos",
    kind: "medicamento",
    label: "Macrolídeos",
    hint: "azitromicina, claritromicina",
    featured: true,
    aliases: ["macrolideo", "macrolideos", "azitromicina", "claritromicina", "eritromicina"],
    terms: ["azitromicina", "claritromicina", "eritromicina", "roxitromicina", "espiramicina"],
  },
  {
    id: "quinolonas",
    kind: "medicamento",
    label: "Quinolonas",
    hint: "ciprofloxacino, levofloxacino",
    featured: true,
    aliases: ["quinolona", "quinolonas", "fluoroquinolona", "fluoroquinolonas", "ciprofloxacino", "levofloxacino", "cipro"],
    terms: ["ciprofloxacino", "levofloxacino", "norfloxacino", "moxifloxacino", "ofloxacino", "gatifloxacino"],
  },
  {
    id: "anticonvulsivantes",
    kind: "medicamento",
    label: "Anticonvulsivantes",
    hint: "carbamazepina, fenitoína",
    featured: true,
    aliases: ["anticonvulsivante", "anticonvulsivantes", "antiepileptico", "antiepilepticos", "carbamazepina", "fenitoina", "lamotrigina", "fenobarbital"],
    terms: ["carbamazepina", "oxcarbazepina", "fenitoina", "lamotrigina", "fenobarbital", "primidona"],
  },
  // ─── Medicamentos reconhecidos só pelo texto ("Outros") ───────────────────
  {
    id: "opioides",
    kind: "medicamento",
    label: "Opioides",
    featured: false,
    aliases: ["opioide", "opioides", "codeina", "morfina", "tramadol"],
    terms: ["codeina", "morfina", "tramadol", "oxicodona", "fentanila", "metadona"],
  },
  {
    id: "tetraciclinas",
    kind: "medicamento",
    label: "Tetraciclinas",
    featured: false,
    aliases: ["tetraciclina", "tetraciclinas", "doxiciclina", "minociclina"],
    terms: ["tetraciclina", "doxiciclina", "minociclina", "limeciclina"],
  },
  {
    id: "anestesicos",
    kind: "medicamento",
    label: "Anestésicos locais",
    featured: false,
    aliases: ["anestesico", "anestesicos", "anestesico local", "lidocaina", "benzocaina"],
    terms: ["lidocaina", "benzocaina", "bupivacaina", "mepivacaina", "articaina", "procaina", "tetracaina"],
  },
  {
    id: "iodo",
    kind: "medicamento",
    label: "Iodo / contraste iodado",
    featured: false,
    aliases: ["iodo", "contraste", "contraste iodado", "iodopovidona"],
    terms: ["iodo", "iodeto", "iopamidol", "iohexol", "iodopovidona", "povidona-iodo"],
  },
];

export const FEATURED_FOOD = ALLERGEN_GROUPS.filter((g) => g.kind === "alimento" && g.featured);
export const FEATURED_DRUG = ALLERGEN_GROUPS.filter((g) => g.kind === "medicamento" && g.featured);
export const MILK_GROUP = ALLERGEN_GROUPS[0];
export const groupById = (id: string) => ALLERGEN_GROUPS.find((g) => g.id === id);

export const normalizeText = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Termo como palavra inteira (não casa "ovo" dentro de "novo") */
export const wordRegex = (term: string) => new RegExp(`(^|[^a-z0-9])${escapeRe(term)}([^a-z0-9]|$)`);

// ─── Alergias do usuário ─────────────────────────────────────────────────────

export type UserAllergies = {
  /** Grupos marcados ou reconhecidos, na ordem do catálogo */
  groups: AllergenGroup[];
  /** Termos de "Outros" que não pertencem a nenhum grupo; procurados como foram escritos */
  custom: string[];
  /** Nenhuma alergia informada */
  empty: boolean;
};

/** O que fica salvo no perfil */
export type AllergySelection = {
  food: string[];
  drug: string[];
  /** Texto livre do "Outros" */
  other: string;
};

export const EMPTY_SELECTION: AllergySelection = { food: [], drug: [], other: "" };

/** Palavras que não dizem nada sozinhas ("alergia a ovo e soja") */
const FILLER = /\b(alergia|alergias|alergic[oa]s?|intolerancia|intolerante|a|ao|aos|as|de|do|da|dos|das|com|sem|tem|possui|proteina)\b/g;

/**
 * Interpreta o texto livre de "Outros".
 * Aceita vírgula, ponto e vírgula, barra, quebra de linha, "e"/"ou" entre os itens.
 */
export const parseAllergyInfo = (raw: string | null | undefined): UserAllergies => {
  const text = normalizeText(raw ?? "");
  if (!text || /^(nenhuma?|nao (tem|possui|informado)|-)$/.test(text)) return { groups: [], custom: [], empty: true };

  const found = new Set<string>();
  const custom: string[] = [];
  const segments = text.split(/[,;\n/|.()+]+|\s(?:e|ou)\s/).map((s) => s.trim()).filter(Boolean);
  for (const seg of segments) {
    const ids = ALLERGEN_GROUPS.filter((g) => g.aliases.some((a) => wordRegex(a).test(seg))).map((g) => g.id);
    if (ids.length) {
      // "Ovos desidratados", "clara de ovo": o item já foi reconhecido; o resto é só descrição
      ids.forEach((id) => found.add(id));
      continue;
    }
    const term = seg.replace(FILLER, " ").replace(/[^a-z0-9 -]/g, " ").replace(/\s+/g, " ").trim();
    if (term.length >= 3) custom.push(term);
  }

  return {
    groups: ALLERGEN_GROUPS.filter((g) => found.has(g.id)),
    custom: [...new Set(custom)],
    empty: found.size === 0 && custom.length === 0,
  };
};

/** Junta o que foi marcado nas listas com o que foi reconhecido em "Outros" */
export const buildUserAllergies = (sel: AllergySelection | null | undefined): UserAllergies => {
  const s = sel ?? EMPTY_SELECTION;
  const parsed = parseAllergyInfo(s.other);
  const ids = new Set([...s.food, ...s.drug, ...parsed.groups.map((g) => g.id)]);
  const groups = ALLERGEN_GROUPS.filter((g) => ids.has(g.id));
  return { groups, custom: parsed.custom, empty: groups.length === 0 && parsed.custom.length === 0 };
};

/** Sem alergia cadastrada, o app segue o foco original: APLV */
export const effectiveAllergies = (a: UserAllergies | null | undefined): UserAllergies =>
  !a || a.empty ? { groups: [MILK_GROUP], custom: [], empty: true } : a;

export const hasMilkAllergy = (a: UserAllergies) => a.groups.some((g) => g.id === "leite");

/** Só as alergias alimentares (e termos próprios): usado no scanner de rótulos */
export const foodOnly = (a: UserAllergies): UserAllergies => ({ ...a, groups: a.groups.filter((g) => g.kind === "alimento") });

/**
 * Texto de reserva salvo em `allergy_info` quando o banco ainda não tem as colunas
 * `food_allergies`/`drug_allergies`. É reconhecido de volta por `parseAllergyInfo`.
 */
export const selectionToText = (sel: AllergySelection) =>
  [...sel.food, ...sel.drug]
    .map((id) => groupById(id)?.aliases[0])
    .filter(Boolean)
    .concat(sel.other.trim() ? [sel.other.trim()] : [])
    .join(", ");

/**
 * Converte a linha do perfil na seleção de alergias.
 * - Com as colunas `food_allergies`/`drug_allergies` preenchidas: usa-as; `allergy_info` é o "Outros".
 * - Sem elas (perfis antigos ou banco sem a migração): reconhece o texto de `allergy_info`,
 *   marca os itens das listas e deixa no "Outros" só o que não está nelas.
 */
export const selectionFromRow = (row: Record<string, unknown> | null): AllergySelection => {
  const text = typeof row?.allergy_info === "string" ? row.allergy_info : "";
  const asIds = (v: unknown) => (Array.isArray(v) ? v.map(String).filter((id) => groupById(id)) : []);
  const food = asIds(row?.food_allergies);
  const drug = asIds(row?.drug_allergies);
  if (food.length || drug.length) return { food, drug, other: text };

  const parsed = parseAllergyInfo(text);
  const featured = (kind: "alimento" | "medicamento") =>
    parsed.groups.filter((g) => g.featured && g.kind === kind).map((g) => g.id);
  const rest = [...parsed.groups.filter((g) => !g.featured).map((g) => g.aliases[0]), ...parsed.custom];
  return { food: featured("alimento"), drug: featured("medicamento"), other: rest.join(", ") };
};

// ─── Busca em textos ─────────────────────────────────────────────────────────

export type AllergenHit = {
  /** id do grupo, ou "custom" para termos próprios */
  id: string;
  label: string;
  kind: AllergenKind | "custom";
  /** Termos encontrados no texto */
  found: string[];
};

/** Lista de termos de busca para as alergias do usuário */
export const searchTermsFor = (a: UserAllergies) => [
  ...a.groups.map((g) => ({ id: g.id, label: g.label, kind: g.kind as AllergenHit["kind"], terms: g.terms })),
  ...a.custom.map((c) => ({ id: "custom", label: c, kind: "custom" as const, terms: [c] })),
];

/**
 * Procura os alérgenos do usuário num texto (composição, ingrediente, rótulo).
 * `match` permite trocar a comparação (ex.: tolerância a erros de leitura de foto).
 */
export const findAllergens = (
  text: string,
  a: UserAllergies,
  match: (normText: string, term: string) => boolean = (t, term) => wordRegex(term).test(t),
): AllergenHit[] => {
  const t = normalizeText(text);
  if (!t) return [];
  return searchTermsFor(a)
    .map(({ id, label, kind, terms }) => ({ id, label, kind, found: terms.filter((term) => match(t, term)) }))
    .filter((h) => h.found.length > 0);
};

/**
 * Ingredientes de origem não informada que podem conter uma alergia do usuário.
 * O texto é dividido por ingrediente (vírgula/ponto e vírgula) para checar o complemento
 * ("amido de milho" esclarece; "amido" sozinho não).
 */
export const findAmbiguous = (text: string, a: UserAllergies): AllergenHit[] => {
  const items = normalizeText(text).split(/[,;:]|\.\s/).map((s) => s.trim()).filter(Boolean);
  return a.groups
    .map((g) => ({
      id: g.id,
      label: g.label,
      kind: g.kind as AllergenHit["kind"],
      found: [
        ...new Set(
          (g.ambiguous ?? [])
            .filter(({ term, unless }) =>
              items.some((it) => wordRegex(term).test(it) && !unless.some((u) => it.includes(u)) && !g.terms.some((t) => wordRegex(t).test(it))),
            )
            .map(({ term }) => term),
        ),
      ],
    }))
    .filter((h) => h.found.length > 0);
};

/** "Ovo", "Ovo e Soja", "Ovo, Soja e Glúten" */
export const joinLabels = (labels: string[]) =>
  labels.length <= 1 ? labels[0] ?? "" : `${labels.slice(0, -1).join(", ")} e ${labels[labels.length - 1]}`;

/** Rótulo curto para frases ("leite" em vez de "Leite (APLV)") */
export const shortLabel = (label: string) => label.replace(/\s*\(.*\)$/, "").toLowerCase();
