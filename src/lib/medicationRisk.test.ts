import { describe, it, expect } from "vitest";
import { buildUserAllergies, effectiveAllergies } from "./allergens";
import { assessMedication, assessmentBadge } from "./medicationRisk";

const profile = (food: string[], drug: string[] = [], other = "") => effectiveAllergies(buildUserAllergies({ food, drug, other }));

const comLeite = {
  nome_principal: "Remédio X",
  tem_risco_aplv: true,
  nivel_alerta: "VERMELHO",
  composicao: "Paracetamol 500 mg. Excipientes: lactose monoidratada, celulose, estearato de magnésio.",
};
const semLeite = {
  nome_principal: "Remédio Y",
  tem_risco_aplv: false,
  nivel_alerta: "VERDE",
  composicao: "Ibuprofeno 100 mg/ml. Excipientes: sacarose, água, benzoato de sódio.",
};

describe("assessMedication", () => {
  it("sem alergias no perfil: segue APLV (igual ao catálogo)", () => {
    expect(assessMedication(comLeite, profile([])).level).toBe("risk");
    expect(assessMedication(semLeite, profile([])).level).toBe("safe");
  });

  it("perfil só com ovo: leite não pinta de vermelho, mas fica registrado", () => {
    const r = assessMedication(comLeite, profile(["ovo"]));
    expect(r.level).toBe("safe");
    expect(r.milkChecked).toBe(false);
    expect(r.milkLevel).toBe("risk");
  });

  it("ovo na composição → risco", () => {
    const r = assessMedication({ ...semLeite, composicao: semLeite.composicao + " Lisozima." }, profile(["ovo"]));
    expect(r.level).toBe("risk");
    expect(r.hits[0].label).toBe("Ovo");
  });

  it("ingrediente de origem desconhecida → atenção, nunca seguro", () => {
    const r = assessMedication({ ...semLeite, composicao: "Dipirona. Excipientes: lecitina, talco." }, profile(["ovo"]));
    expect(r.level).toBe("caution");
    expect(r.ambiguous[0].found).toEqual(["lecitina"]);
  });

  it("sem composição → atenção para as alergias além de leite", () => {
    const r = assessMedication({ ...semLeite, composicao: null }, profile(["ovo"]));
    expect(r.level).toBe("caution");
    expect(r.unverified).toEqual(["Ovo"]);
  });

  it("alergia a remédio: princípio ativo no nome ou na composição → risco", () => {
    expect(assessMedication(semLeite, profile([], ["aines"])).level).toBe("risk");
    expect(assessMedication({ ...semLeite, nome_completo: "Amoxicilina tri-hidratada" }, profile([], ["penicilinas"])).level).toBe("risk");
  });

  it("reação cruzada entre classes → atenção", () => {
    const cefalexina = { ...semLeite, composicao: "Cefalexina 500 mg. Excipientes: talco." };
    const r = assessMedication(cefalexina, profile([], ["penicilinas"]));
    expect(r.level).toBe("caution");
    expect(r.cross[0]).toMatchObject({ label: "Cefalosporinas", because: "Penicilinas" });
  });

  it("leite + ovo: o pior resultado vence", () => {
    expect(assessMedication(comLeite, profile(["leite", "ovo"])).level).toBe("risk");
  });

  it("bula trocada e ainda não reanalisada → atenção, nunca seguro", () => {
    const r = assessMedication({ ...semLeite, bula_reanalisar: true }, profile([]));
    expect(r.level).toBe("caution");
    expect(r.bulaPending).toBe(true);
    // risco continua risco
    expect(assessMedication({ ...comLeite, bula_reanalisar: true }, profile([])).level).toBe("risk");
  });

  it("selo das listas", () => {
    expect(assessmentBadge(assessMedication(comLeite, profile([])), false)).toBe("Risco (Contém Leite)");
    const r = assessMedication({ ...comLeite, composicao: comLeite.composicao + " Albumina." }, profile(["leite", "ovo"]));
    expect(assessmentBadge(r, true)).toBe("Risco: leite e ovo");
  });
});
