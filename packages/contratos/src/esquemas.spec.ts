import { esquemaCambioEstado, esquemaNuevoPedido } from "./pedidos.js";
import { esquemaDatosReloj } from "./relojes.js";

const reloj = {
  nombre: "Presage",
  marcaNueva: "Seiko",
  genero: "Hombre",
  precioCop: 3_450_000,
  modo: "DISPONIBLE",
  cantidad: 2,
  garantia: "12 meses",
  visible: true,
  fotos: ["relojes/principal.jpg"],
};

describe("esquemaDatosReloj", () => {
  it("limpia los textos vacíos y deja cada modo con lo suyo", () => {
    const disponible = esquemaDatosReloj.parse({
      ...reloj,
      plazoEstimado: "10 días",
      descripcion: " ",
    });
    const bajoPedido = esquemaDatosReloj.parse({
      ...reloj,
      modo: "BAJO_PEDIDO",
      cantidad: 5,
      plazoEstimado: "8 a 15 días hábiles",
    });

    expect(disponible).toMatchObject({
      cantidad: 2,
      plazoEstimado: null,
      descripcion: null,
      idMarca: null,
    });
    expect(bajoPedido).toMatchObject({ cantidad: null, plazoEstimado: "8 a 15 días hábiles" });
  });

  it.each([0, -1, 1.5, "3450000"])("rechaza el precio %j (REQ-ADM-3)", (precioCop) => {
    expect(esquemaDatosReloj.safeParse({ ...reloj, precioCop }).success).toBe(false);
  });

  it("exige cantidad en Disponible, marca y al menos una foto de la carpeta de relojes", () => {
    expect(esquemaDatosReloj.safeParse({ ...reloj, cantidad: null }).success).toBe(false);
    expect(esquemaDatosReloj.safeParse({ ...reloj, marcaNueva: "" }).success).toBe(false);
    expect(esquemaDatosReloj.safeParse({ ...reloj, fotos: [] }).success).toBe(false);
    expect(esquemaDatosReloj.safeParse({ ...reloj, fotos: ["../secreto.jpg"] }).success).toBe(
      false,
    );
  });
});

describe("esquemaNuevoPedido", () => {
  const pedido = {
    idReloj: 1,
    nombreComprador: "Ana Pérez",
    telefonoComprador: "3001234567",
    idCiudad: 5001,
    direccion: "Calle 1 # 2-3",
    aceptaPolitica: true,
    claveIdempotencia: "clave-de-prueba-001",
  };

  it("acepta un pedido completo", () => {
    expect(esquemaNuevoPedido.safeParse(pedido).success).toBe(true);
  });

  it.each([
    { aceptaPolitica: false },
    { telefonoComprador: "300 123 4567" },
    { telefonoComprador: "300123456" },
    { nombreComprador: " " },
    { claveIdempotencia: "corta" },
  ])("rechaza %j", (cambio) => {
    expect(esquemaNuevoPedido.safeParse({ ...pedido, ...cambio }).success).toBe(false);
  });
});

describe("esquemaCambioEstado", () => {
  it("exige un motivo solo para cancelar", () => {
    expect(esquemaCambioEstado.safeParse({ estado: "CONFIRMADO" }).success).toBe(true);
    expect(esquemaCambioEstado.safeParse({ estado: "CANCELADO" }).success).toBe(false);
    expect(esquemaCambioEstado.safeParse({ estado: "CANCELADO", motivo: "  " }).success).toBe(
      false,
    );
    expect(
      esquemaCambioEstado.safeParse({ estado: "CANCELADO", motivo: "Ya no lo quiere" }).success,
    ).toBe(true);
  });
});
