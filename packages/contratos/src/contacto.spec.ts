import { normalizarWhatsapp, resolverContacto } from "./contacto.js";

describe("normalizarWhatsapp", () => {
  it.each([
    ["300 123 4567", "573001234567"],
    ["(300) 123-4567", "573001234567"],
    ["+57 300 123 4567", "573001234567"],
    ["12025550123", "12025550123"],
  ])("%s pasa a %s", (entrada, esperado) => {
    expect(normalizarWhatsapp(entrada)).toBe(esperado);
  });

  it.each(["", "abc", "12345", "1234567890123456"])("rechaza %j", (entrada) => {
    expect(normalizarWhatsapp(entrada)).toBeNull();
  });
});

describe("resolverContacto", () => {
  const enlaces = [
    { tipo: "WHATSAPP", valor: " 300 123 4567 ", activo: true },
    { tipo: "INSTAGRAM", valor: "https://www.instagram.com/omsha_to/?hl=es", activo: true },
    { tipo: "TIKTOK", valor: "https://www.tiktok.com/@omsha_to", activo: true },
  ] as const;

  it("arma el teléfono visible y el usuario de cada perfil", () => {
    expect(resolverContacto([...enlaces])).toEqual({
      whatsapp: { numero: "573001234567", visible: "+57 300 123 4567" },
      instagram: { url: "https://www.instagram.com/omsha_to/?hl=es", usuario: "omsha_to" },
      tiktok: { url: "https://www.tiktok.com/@omsha_to", usuario: "omsha_to" },
    });
  });

  it("no muestra un enlace inactivo, vacío o ausente (REQ-CON-4)", () => {
    const resultado = resolverContacto([
      { tipo: "WHATSAPP", valor: "300 123 4567", activo: false },
      { tipo: "INSTAGRAM", valor: "  ", activo: true },
    ]);

    expect(resultado).toEqual({ whatsapp: null, instagram: null, tiktok: null });
  });

  it("no muestra un WhatsApp con un número que no es un teléfono", () => {
    expect(
      resolverContacto([{ tipo: "WHATSAPP", valor: "no es un número", activo: true }]).whatsapp,
    ).toBeNull();
  });
});
