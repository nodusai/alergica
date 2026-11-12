import { describe, it, expect } from "vitest";
import { classifyLabelText } from "./labelAnalysis";

describe("classifyLabelText", () => {
  it("detecta leite nos ingredientes (Nescau, leitura real do teste)", () => {
    const r = classifyLabelText(
      "INGREDIENTES — AÇÚCAR, CACAU EM PÓ, MALTODEXTRINA, MINERAIS, SORO DE LEITE EM PÓ, VITAMINAS",
    );
    expect(r.verdict).toBe("contains");
    expect(r.found).toContain("leite");
  });

  it("separa 'pode conter leite' (traços) de ingredientes", () => {
    const r = classifyLabelText(
      "INGREDIENTES: AÇÚCAR, CACAU, MALTODEXTRINA. ALÉRGICOS: CONTÉM DERIVADOS DE SOJA. PODE CONTER LEITE, AVEIA E TRIGO.",
    );
    expect(r.verdict).toBe("traces");
  });

  it("aceita pequenas falhas de leitura em 'pode conter'", () => {
    expect(classifyLabelText("Ingredientes: açúcar, cacau. Pode conler leite.").verdict).toBe("traces");
  });

  it("nunca conclui 'seguro': sem termos lácteos o resultado é inconclusivo", () => {
    const r = classifyLabelText("Ingredientes: Fécula de mandioca e água. NÃO CONTÉM GLÚTEN.");
    expect(r.verdict).toBe("inconclusive");
  });

  it("ignora 'não contém leite' e 'zero lactose' como ingrediente, mas pega leite real", () => {
    expect(classifyLabelText("Ingredientes: arroz, água. Não contém leite.").verdict).toBe("inconclusive");
    expect(classifyLabelText("Bebida láctea zero lactose. Ingredientes: leite integral, cacau.").verdict).toBe("contains");
    expect(classifyLabelText("Ingredientes: soja, água. Zero lactose.").verdict).toBe("inconclusive");
  });

  it("não confunde palavras parecidas", () => {
    // "leiteira" e "deleite" não são o termo "leite"
    expect(classifyLabelText("Ingredientes: farinha. Fabricado por Deleite Alimentos.").verdict).toBe("inconclusive");
  });

  it("tolera letras trocadas pela leitura automática", () => {
    expect(classifyLabelText("Ingredientes: açúcar, le1te em pó desnatado.").verdict).toBe("contains");
    expect(classifyLabelText("Ingredientes: açúcar, lelte em pó.").verdict).toBe("contains");
    expect(classifyLabelText("CONTÉM LACTCSE.").found).toContain("lactose");
    expect(classifyLabelText("Pode conter leíte e soja.").verdict).toBe("traces");
  });

  it("lê o rótulo da foto de teste (barra de cereal, texto inclinado)", () => {
    const lido =
      "Ingr.: cereais 62% (farinha de trigo enriquecida com ferro, ácido fólico), açúcar, óleo vegetal, mel, " +
      "sal, leite em pó desnatado, vitaminas. ALÉRGICOS: CONTÉM DERIVADOS DE TRIGO, SOJA, CENTEIO, AVEIA, LEITE E " +
      "CEVADA. PODE CONTER CASTANHA-DE-CAJU, AVELÃ E AMENDOIM. CONTÉM LACTOSE. CONTÉM GLÚTEN.";
    const r = classifyLabelText(lido);
    expect(r.verdict).toBe("contains");
    expect(r.found).toEqual(expect.arrayContaining(["leite", "lactose"]));
  });

  it("reconhece outros derivados", () => {
    expect(classifyLabelText("Ingredientes: farinha, manteiga, ovos.").found).toContain("manteiga");
    expect(classifyLabelText("Contém caseinato de sódio.").found).toContain("caseinato");
  });
});
