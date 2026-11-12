import { describe, it, expect } from "vitest";
import { createHash } from "node:crypto";
import { sha256Js } from "./bulas";

describe("sha256Js (reserva sem crypto.subtle)", () => {
  it("bate com o SHA-256 padrão em vários tamanhos", () => {
    for (const size of [0, 1, 55, 56, 63, 64, 65, 1000, 70000]) {
      const data = new Uint8Array(size).map((_, i) => (i * 31 + 7) & 255);
      expect(sha256Js(data)).toBe(createHash("sha256").update(data).digest("hex"));
    }
  });
});
