import { estadoInicial, puedeCambiar, transiciones } from "./estados.js";
import { CODIGOS_ESTADO_PEDIDO } from "./tipos.js";

describe("estados del pedido (Tabla 2 del SRS)", () => {
  it("nace Recibido si el reloj está Disponible y Por conseguir si es Bajo pedido (REQ-PED-9)", () => {
    expect(estadoInicial("DISPONIBLE")).toBe("RECIBIDO");
    expect(estadoInicial("BAJO_PEDIDO")).toBe("POR_CONSEGUIR_CON_PROVEEDOR");
  });

  it.each([
    ["RECIBIDO", "CONFIRMADO", true],
    ["RECIBIDO", "CANCELADO", true],
    ["POR_CONSEGUIR_CON_PROVEEDOR", "CONFIRMADO", true],
    ["CONFIRMADO", "ENVIADO", true],
    ["CONFIRMADO", "CANCELADO", true],
    ["ENVIADO", "ENTREGADO", true],
    ["ENVIADO", "CANCELADO", false],
    ["RECIBIDO", "ENVIADO", false],
    ["RECIBIDO", "POR_CONSEGUIR_CON_PROVEEDOR", false],
    ["ENTREGADO", "CANCELADO", false],
    ["CANCELADO", "RECIBIDO", false],
  ] as const)("de %s a %s: %s", (desde, hacia, permitido) => {
    expect(puedeCambiar(desde, hacia)).toBe(permitido);
  });

  it("Entregado y Cancelado son finales y ningún estado pasa a sí mismo", () => {
    expect(transiciones.ENTREGADO).toEqual([]);
    expect(transiciones.CANCELADO).toEqual([]);
    for (const codigo of CODIGOS_ESTADO_PEDIDO) {
      expect(transiciones[codigo]).not.toContain(codigo);
    }
  });
});
