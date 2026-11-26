import type { EstadoPedido } from "@omshato/contratos";

/**
 * Los 6 estados del pedido (Tabla 2 del SRS). El `id` es el de la tabla `estado_pedido` y el
 * `codigo` es el que viaja por la API. Las reglas de cambio (`puedeCambiar`, `estadoInicial`)
 * son del paquete de contratos, porque el panel las usa para mostrar qué botones ofrecer.
 */
export const ESTADOS_PEDIDO = [
  { id: 1, codigo: "RECIBIDO", nombre: "Recibido" },
  { id: 2, codigo: "POR_CONSEGUIR_CON_PROVEEDOR", nombre: "Por conseguir con proveedor" },
  { id: 3, codigo: "CONFIRMADO", nombre: "Confirmado" },
  { id: 4, codigo: "ENVIADO", nombre: "Enviado" },
  { id: 5, codigo: "ENTREGADO", nombre: "Entregado" },
  { id: 6, codigo: "CANCELADO", nombre: "Cancelado" },
] as const satisfies readonly { id: number; codigo: EstadoPedido; nombre: string }[];

const POR_CODIGO = new Map<EstadoPedido, number>(ESTADOS_PEDIDO.map((e) => [e.codigo, e.id]));
const POR_ID = new Map<number, EstadoPedido>(ESTADOS_PEDIDO.map((e) => [e.id, e.codigo]));

export function idDeEstado(codigo: EstadoPedido) {
  return POR_CODIGO.get(codigo) as number;
}

export function codigoDeEstado(id: number) {
  return POR_ID.get(id) as EstadoPedido;
}
