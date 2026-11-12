import { describe, it, expect } from "vitest";
import {
  buildUserAllergies,
  effectiveAllergies,
  FEATURED_DRUG,
  FEATURED_FOOD,
  findAllergens,
  findAmbiguous,
  parseAllergyInfo,
  selectionFromRow,
  selectionToText,
} from "./allergens";

const ids = (raw: string) => parseAllergyInfo(raw).groups.map((g) => g.id);

describe("listas de seleção", () => {
  it("tem 10 alergias alimentares e 10 classes de medicamentos", () => {
    expect(FEATURED_FOOD).toHaveLength(10);
    expect(FEATURED_DRUG).toHaveLength(10);
  });
});

describe("parseAllergyInfo (campo Outros)", () => {
  it("reconhece a lista sem separadores (caso real da tela de perfil)", () => {
    const r = parseAllergyInfo(
      "Ovo Clara de ovo Gema de ovo Albúmen Ovoalbumina Ovomucina Ovotransferrina Lisozima Lecitina de ovo " +
        "Maionese Ovo em pó Ovos desidratados Albumina Ovomucoide",
    );
    expect(r.groups.map((g) => g.id)).toEqual(["ovo"]);
    expect(r.custom).toEqual([]);
  });

  it("reconhece alimentos e remédios escritos à mão", () => {
    expect(ids("APLV, ovo e soja")).toEqual(["leite", "ovo", "soja"]);
    expect(ids("Doença celíaca; amendoim / castanha-de-caju")).toEqual(["gluten", "amendoim", "castanhas"]);
    expect(ids("amoxicilina, Novalgina")).toEqual(["penicilinas", "dipirona"]);
    expect(ids("tramadol e tartrazina")).toEqual(["corantes", "opioides"]);
  });

  it("guarda o que não reconhece como termo próprio", () => {
    const r = parseAllergyInfo("ovo, kiwi, alergia a hidroxizina");
    expect(r.groups.map((g) => g.id)).toEqual(["ovo"]);
    expect(r.custom).toEqual(["kiwi", "hidroxizina"]);
  });

  it("perfil vazio ou 'nenhuma' cai no padrão APLV", () => {
    expect(parseAllergyInfo("").empty).toBe(true);
    expect(parseAllergyInfo("Nenhuma").empty).toBe(true);
    expect(effectiveAllergies(buildUserAllergies({ food: [], drug: [], other: "" })).groups.map((g) => g.id)).toEqual(["leite"]);
  });
});

describe("buildUserAllergies / selectionToText", () => {
  it("junta listas marcadas e o que foi reconhecido em Outros", () => {
    const a = buildUserAllergies({ food: ["ovo"], drug: ["penicilinas"], other: "camarão, kiwi" });
    expect(a.groups.map((g) => g.id)).toEqual(["ovo", "crustaceos", "penicilinas"]);
    expect(a.custom).toEqual(["kiwi"]);
  });

  it("o texto de reserva é reconhecido de volta igual", () => {
    const sel = { food: ["leite", "gluten", "castanhas"], drug: ["aines", "aas", "sulfas"], other: "kiwi" };
    const back = parseAllergyInfo(selectionToText(sel));
    expect(back.groups.map((g) => g.id).sort()).toEqual([...sel.food, ...sel.drug].sort());
    expect(back.custom).toEqual(["kiwi"]);
  });
});

describe("findAllergens / findAmbiguous", () => {
  it("encontra ovo e termos próprios", () => {
    const a = parseAllergyInfo("ovo, kiwi");
    const hits = findAllergens("Excipientes: lactose, lisozima, extrato de kiwi, amido.", a);
    expect(hits.map((h) => h.label)).toEqual(["Ovo", "kiwi"]);
  });

  it("não confunde palavras parecidas nem acusa leite para quem só tem ovo", () => {
    const a = parseAllergyInfo("ovo");
    expect(findAllergens("Produto novo, fórmula renovada.", a)).toEqual([]);
    expect(findAllergens("leite em pó", a)).toEqual([]);
  });

  it("ingrediente sem origem informada é suspeito; com origem, não", () => {
    const ovo = parseAllergyInfo("ovo");
    expect(findAmbiguous("celulose, lecitina, talco", ovo)[0].found).toEqual(["lecitina"]);
    expect(findAmbiguous("celulose, lecitina de soja, talco", ovo)).toEqual([]);
    const gluten = parseAllergyInfo("glúten");
    expect(findAmbiguous("amido, estearato de magnésio", gluten)[0].found).toEqual(["amido"]);
    expect(findAmbiguous("amido de milho, glicolato de amido sódico", gluten)).toEqual([]);
  });
});

describe("selectionFromRow (perfis já salvos)", () => {
  it("perfil antigo só com texto: marca Ovo na lista e não deixa sobras no Outros", () => {
    const sel = selectionFromRow({
      allergy_info: "Ovo Clara de ovo Gema de ovo Albúmen Lisozima Maionese Ovos desidratados Albumina Ovomucoide",
    });
    expect(sel).toEqual({ food: ["ovo"], drug: [], other: "" });
  });

  it("texto com itens fora das listas vai para o Outros", () => {
    expect(selectionFromRow({ allergy_info: "APLV, amoxicilina, tramadol, kiwi" })).toEqual({
      food: ["leite"],
      drug: ["penicilinas"],
      other: "opioide, kiwi",
    });
  });

  it("com as colunas novas, usa as listas e o texto como Outros", () => {
    expect(selectionFromRow({ food_allergies: ["soja"], drug_allergies: ["dipirona"], allergy_info: "kiwi" })).toEqual({
      food: ["soja"],
      drug: ["dipirona"],
      other: "kiwi",
    });
  });
});
