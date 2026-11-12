/**
 * Classificação de um medicamento para as alergias do usuário — regra ÚNICA,
 * usada nas listas, na busca, no detalhe e nas alternativas (mesmo resultado em toda parte).
 *
 * Princípio: na dúvida, "Atenção". "Seguro" só quando todas as alergias do perfil
 * puderam ser verificadas e nada (nem suspeito) foi encontrado.
 */
import {
  ALLERGEN_GROUPS,
  findAllergens,
  findAmbiguous,
  hasMilkAllergy,
  joinLabels,
  shortLabel,
  type AllergenHit,
  type UserAllergies,
} from "./allergens";

export type RiskLevel = "safe" | "caution" | "risk";

export type MedForRisk = {
  tem_risco_aplv: boolean | null | undefined;
  nivel_alerta: string | null | undefined;
  avisos?: unknown;
  composicao?: string | null;
  nome_principal?: string | null;
  nome_completo?: string | null;
  /** A bula foi trocada e a análise ainda não foi refeita */
  bula_reanalisar?: boolean | null;
};

/** Classificação do catálogo para LEITE (APLV), a partir da análise da bula. */
export const catalogMilkRisk = (
  temRisco: boolean | null | undefined,
  nivel: string | null | undefined,
  avisos?: unknown,
): RiskLevel => {
  const n = (nivel ?? "").toLowerCase();
  const avStr = Array.isArray(avisos) ? (avisos as unknown[]).map(String).join(" ") : String(avisos ?? "");
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

export type MedicationAssessment = {
  level: RiskLevel;
  /** Leite está entre as alergias verificadas (perfil com APLV ou sem alergias) */
  milkChecked: boolean;
  /** Resultado do catálogo para leite (sempre calculado) */
  milkLevel: RiskLevel;
  /** Alergias do perfil encontradas (exceto leite, que vem do catálogo) */
  hits: AllergenHit[];
  /** Ingredientes de origem não informada que podem conter uma alergia do perfil */
  ambiguous: AllergenHit[];
  /** Classes de remédio com possível reação cruzada a uma alergia do perfil */
  cross: { label: string; because: string; found: string[] }[];
  /** Composição ausente: alergias do perfil (além de leite) não puderam ser verificadas */
  unverified: string[];
  /** Nomes das alergias que esta análise verificou */
  checked: string[];
  /** Bula nova aguardando análise: o resultado não pode ser "Seguro" */
  bulaPending: boolean;
};

const RANK: Record<RiskLevel, number> = { safe: 0, caution: 1, risk: 2 };
const worst = (...levels: RiskLevel[]) => levels.reduce((a, b) => (RANK[b] > RANK[a] ? b : a), "safe" as RiskLevel);

export const assessMedication = (med: MedForRisk, allergies: UserAllergies): MedicationAssessment => {
  const milkChecked = hasMilkAllergy(allergies);
  const milkLevel = catalogMilkRisk(med.tem_risco_aplv, med.nivel_alerta, med.avisos);

  const comp = (med.composicao ?? "").trim();
  const names = [med.nome_principal, med.nome_completo].filter(Boolean).join(" ; ");

  const others: UserAllergies = { ...allergies, groups: allergies.groups.filter((g) => g.id !== "leite") };
  const foodGroups: UserAllergies = { groups: others.groups.filter((g) => g.kind === "alimento"), custom: [], empty: false };
  const drugGroups: UserAllergies = { groups: others.groups.filter((g) => g.kind === "medicamento"), custom: [], empty: false };
  const customOnly: UserAllergies = { groups: [], custom: others.custom, empty: false };

  // Alimentos: só na composição. Medicamentos e termos próprios: no nome e na composição.
  const hits = [
    ...findAllergens(comp, foodGroups),
    ...findAllergens(`${names} ; ${comp}`, drugGroups),
    ...findAllergens(`${names} ; ${comp}`, customOnly),
  ];
  const ambiguous = comp ? findAmbiguous(comp, foodGroups) : [];

  // Reação cruzada: classes ligadas às do perfil, que o usuário não marcou
  const profileIds = new Set(others.groups.map((g) => g.id));
  const cross = drugGroups.groups.flatMap((g) =>
    (g.crossReactive ?? [])
      .filter((id) => !profileIds.has(id))
      .map((id) => ALLERGEN_GROUPS.find((x) => x.id === id)!)
      .map((x) => ({ x, found: findAllergens(`${names} ; ${comp}`, { groups: [x], custom: [], empty: false })[0]?.found ?? [] }))
      .filter(({ found }) => found.length > 0)
      .map(({ x, found }) => ({ label: x.label, because: g.label, found })),
  );

  const unverified = comp ? [] : [...others.groups.map((g) => g.label), ...others.custom];

  const level = worst(
    milkChecked ? milkLevel : "safe",
    hits.length ? "risk" : "safe",
    ambiguous.length || cross.length || unverified.length || med.bula_reanalisar ? "caution" : "safe",
  );

  return {
    level,
    milkChecked,
    milkLevel,
    hits,
    ambiguous,
    cross,
    unverified,
    checked: [...(milkChecked ? ["leite"] : []), ...others.groups.map((g) => shortLabel(g.label)), ...others.custom],
    bulaPending: !!med.bula_reanalisar,
  };
};

/** Texto curto do selo nas listas */
export const assessmentBadge = (a: MedicationAssessment, personalized: boolean): string => {
  if (!personalized) return { safe: "Seguro (Sem Leite)", caution: "Atenção (Verificar)", risk: "Risco (Contém Leite)" }[a.level];
  if (a.level === "safe") return "Seguro para o seu perfil";
  if (a.level === "caution") return "Atenção (Verificar)";
  const what = [...(a.milkChecked && a.milkLevel === "risk" ? ["leite"] : []), ...a.hits.map((h) => shortLabel(h.label))];
  return `Risco: ${joinLabels([...new Set(what)])}`;
};
