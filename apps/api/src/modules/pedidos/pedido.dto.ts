import type { Pedido } from "./entities/pedido.entity.js";
import { codigoDeEstado } from "./estados-pedido.js";

/** Lo que hay que cargar de un pedido para poder armar su respuesta. */
export const RELACIONES_PEDIDO = {
  ciudad: { departamento: true },
  historial: true,
  notas: true,
} as const;

/**
 * El pedido como lo recibe el front. Las notas son internas del administrador (REQ-GPE-11):
 * el comprador nunca las ve, así que solo salen en la versión del panel.
 */
export function aPedidoDto(pedido: Pedido) {
  return {
    id: pedido.id,
    numeroPedido: pedido.numeroPedido,
    idReloj: pedido.idReloj,
    estado: codigoDeEstado(pedido.idEstado),
    departamento: {
      id: pedido.ciudad.departamento.id,
      codigoDane: pedido.ciudad.departamento.codigoDane,
      nombre: pedido.ciudad.departamento.nombre,
    },
    ciudad: {
      id: pedido.ciudad.id,
      idDepartamento: pedido.ciudad.idDepartamento,
      codigoDane: pedido.ciudad.codigoDane,
      nombre: pedido.ciudad.nombre,
    },
    nombreReloj: pedido.nombreReloj,
    precioReloj: pedido.precioReloj,
    modoReloj: pedido.modoReloj,
    nombreComprador: pedido.nombreComprador,
    telefonoComprador: pedido.telefonoComprador,
    direccion: pedido.direccion,
    fechaAutorizacionDatos: pedido.fechaAutorizacionDatos,
    motivoCancelacion: pedido.motivoCancelacion,
    fechaCreacion: pedido.fechaCreacion,
    historial: pedido.historial
      .toSorted((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime() || a.id - b.id)
      .map((fila) => ({
        id: fila.id,
        estado: codigoDeEstado(fila.idEstado),
        idAdministrador: fila.idAdministrador,
        fechaHora: fila.fechaHora,
      })),
  };
}

/** La versión del panel: lo mismo más las notas internas, de la más antigua a la más nueva. */
export function aPedidoAdminDto(pedido: Pedido) {
  return {
    ...aPedidoDto(pedido),
    notas: pedido.notas
      .toSorted((a, b) => a.fechaHora.getTime() - b.fechaHora.getTime() || a.id - b.id)
      .map((nota) => ({
        id: nota.id,
        idAdministrador: nota.idAdministrador,
        texto: nota.texto,
        fechaHora: nota.fechaHora,
      })),
  };
}
