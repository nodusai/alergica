import { describe, it, expect } from "vitest";
import { initials, nameFromEmail, shortName } from "./names";

describe("shortName", () => {
  it("pega os dois primeiros nomes e corrige maiúsculas", () => {
    expect(shortName("CAROLINE LIMA MARQUES")).toBe("Caroline Lima");
    expect(shortName("joão pedro da silva")).toBe("João Pedro");
  });
  it("mantém partículas entre os nomes", () => {
    expect(shortName("Maria de Souza Santos")).toBe("Maria de Souza");
    expect(shortName("Ana dos Santos")).toBe("Ana dos Santos");
  });
  it("lida com um nome só, espaços extras e vazio", () => {
    expect(shortName("  Caroline  ")).toBe("Caroline");
    expect(shortName("Maria de")).toBe("Maria");
    expect(shortName("")).toBe("");
    expect(shortName(null)).toBe("");
  });
});

describe("initials e nameFromEmail", () => {
  it("gera iniciais ignorando partículas", () => {
    expect(initials("Maria de Souza")).toBe("MS");
    expect(initials("Caroline")).toBe("C");
  });
  it("monta um nome a partir do e-mail", () => {
    expect(nameFromEmail("carol.lima313@gmail.com")).toBe("Carol Lima");
  });
});
