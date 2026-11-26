import { slugificar } from "./slug.js";

describe("slugificar", () => {
  it("quita tildes, pasa a minúsculas y une con guiones", () => {
    expect(slugificar("Orient Star Ñandú")).toBe("orient-star-nandu");
  });

  it("colapsa símbolos y espacios repetidos y no deja guiones en los bordes", () => {
    expect(slugificar("  Seiko 5 — Sports (SRPD)!  ")).toBe("seiko-5-sports-srpd");
  });

  it("devuelve vacío si no queda nada utilizable", () => {
    expect(slugificar("¡¿?!")).toBe("");
  });
});
