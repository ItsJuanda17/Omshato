import { describe, expect, it } from "vitest";

import { esquemaCambioContrasena, LARGO_MINIMO_CONTRASENA } from "./auth.js";

describe("esquemaCambioContrasena", () => {
  const valido = { contrasenaActual: "clave-actual-1", contrasenaNueva: "clave-nueva-123" };

  it("acepta una contraseña nueva distinta y suficientemente larga", () => {
    expect(esquemaCambioContrasena.safeParse(valido).success).toBe(true);
  });

  it("exige la contraseña actual", () => {
    expect(esquemaCambioContrasena.safeParse({ ...valido, contrasenaActual: "" }).success).toBe(
      false,
    );
  });

  it("rechaza una contraseña nueva corta, con el campo y el mínimo en el mensaje", () => {
    const resultado = esquemaCambioContrasena.safeParse({
      ...valido,
      contrasenaNueva: "a".repeat(LARGO_MINIMO_CONTRASENA - 1),
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]).toMatchObject({ path: ["contrasenaNueva"] });
    expect(resultado.error?.issues[0]?.message).toContain(String(LARGO_MINIMO_CONTRASENA));
  });

  it("rechaza una contraseña nueva igual a la actual", () => {
    const resultado = esquemaCambioContrasena.safeParse({
      contrasenaActual: "clave-larga-123",
      contrasenaNueva: "clave-larga-123",
    });
    expect(resultado.success).toBe(false);
    expect(resultado.error?.issues[0]).toMatchObject({ path: ["contrasenaNueva"] });
  });

  it("rechaza más de 128 caracteres", () => {
    expect(
      esquemaCambioContrasena.safeParse({ ...valido, contrasenaNueva: "a".repeat(129) }).success,
    ).toBe(false);
  });
});
