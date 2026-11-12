import { describe, it, expect } from "vitest";
import { matchBula, nameTokens, labTokens, type CatalogEntry } from "./bulaMatch";

const catalog: CatalogEntry[] = [
  { id: "nov-500", nome_principal: "Novalgina 500 mg comprimido", nome_alternativo: "Sanofi Medley Farmacêutica Ltda", actives: ["dipirona"] },
  { id: "nov-gotas", nome_principal: "Novalgina 500 mg/ml gotas", nome_alternativo: "Sanofi Medley Farmacêutica Ltda", actives: ["dipirona"] },
  { id: "dip-ems", nome_principal: "Dipirona sódica 500 mg", nome_alternativo: "EMS S/A", actives: ["dipirona"] },
  { id: "dip-medley", nome_principal: "Dipirona sódica 500 mg", nome_alternativo: "Medley Farmacêutica Ltda", actives: ["dipirona"] },
  { id: "tyl", nome_principal: "Tylenol 750 mg", nome_alternativo: "Janssen-Cilag Farmacêutica Ltda", actives: ["paracetamol"] },
  { id: "ringer", nome_principal: "Solução fisiológica de Ringer com lactato de sódio", nome_alternativo: "Fresenius Kabi Brasil Ltda", actives: ["cloreto de sodio + lactato de sodio"] },
];

const bulaNovalgina = {
  head: "NOVALGINA® dipirona monoidratada APRESENTAÇÕES Comprimidos 500 mg e solução oral gotas 500 mg/mL",
  full:
    "NOVALGINA® dipirona monoidratada ... COMPOSIÇÃO ... Fabricado por: Sanofi Medley Farmacêutica Ltda. " +
    "Rua Conde Domingos Papaiz, Suzano - SP",
};

describe("tokens", () => {
  it("tira forma, dose e razão social", () => {
    expect(nameTokens("Dipirona sódica 500 mg (comprimido)")).toEqual(["dipirona"]);
    expect(nameTokens("Solução fisiológica de Ringer com lactato de sódio")).toEqual(["ringer", "lactato"]);
    expect(labTokens("Sanofi Medley Farmacêutica Ltda")).toEqual(["sanofi", "medley"]);
  });
});

describe("matchBula", () => {
  it("marca o produto e as outras apresentações dele (mesmo nome e laboratório)", () => {
    const r = matchBula(bulaNovalgina.full, bulaNovalgina.head, "bula_1736.pdf", "x", catalog);
    expect(r.confidence).toBe("alta");
    expect(r.selected.sort()).toEqual(["nov-500", "nov-gotas"]);
  });

  it("genérico: o laboratório decide entre fabricantes", () => {
    const head = "dipirona sódica Medicamento genérico Lei nº 9.787 APRESENTAÇÃO comprimido 500 mg";
    const full = head + " ... Registrado e fabricado por: EMS S/A Hortolândia SP";
    const r = matchBula(full, head, "123.pdf", "x", catalog);
    expect(r.candidates[0].id).toBe("dip-ems");
    expect(r.selected).toEqual(["dip-ems"]);
  });

  it("sem laboratório no texto, genérico fica para o administrador confirmar", () => {
    const head = "dipirona sódica comprimido 500 mg";
    const r = matchBula(head, head, "123.pdf", "x", catalog);
    expect(r.confidence).not.toBe("alta");
    expect(r.selected).toEqual([]);
  });

  it("arquivo idêntico ao já guardado é reconhecido pelo hash", () => {
    const withSha = catalog.map((e) => (e.id === "tyl" ? { ...e, bula_sha256: "abc" } : e));
    const r = matchBula("qualquer", "qualquer", "a.pdf", "abc", withSha);
    expect(r).toMatchObject({ confidence: "igual", selected: ["tyl"] });
  });

  it("bula de remédio fora do catálogo não sugere nada", () => {
    const r = matchBula("AMOXIL amoxicilina GSK", "AMOXIL amoxicilina", "amoxil.pdf", "x", catalog);
    expect(r.candidates).toEqual([]);
    expect(r.selected).toEqual([]);
  });
});
