import { CODIGOS_ESTADO_PEDIDO } from "@omshato/contratos";

import { codigoDeEstado, ESTADOS_PEDIDO, idDeEstado } from "./estados-pedido.js";

describe("estados del pedido en la base de datos", () => {
  it("el id y el código se corresponden en los seis estados", () => {
    for (const { id, codigo } of ESTADOS_PEDIDO) {
      expect(idDeEstado(codigo)).toBe(id);
      expect(codigoDeEstado(id)).toBe(codigo);
    }
  });

  it("tiene exactamente los estados que conoce el paquete de contratos", () => {
    expect(ESTADOS_PEDIDO.map((estado) => estado.codigo)).toEqual([...CODIGOS_ESTADO_PEDIDO]);
  });
});
