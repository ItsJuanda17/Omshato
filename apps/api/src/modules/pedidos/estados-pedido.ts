/**
 * Los 6 estados del pedido (Tabla 2 del SRS). El `id` es el de la tabla
 * `estado_pedido` y el `codigo` es el que viaja por la API.
 */
export const ESTADOS_PEDIDO = [
  { id: 1, codigo: "RECIBIDO", nombre: "Recibido" },
  { id: 2, codigo: "POR_CONSEGUIR_CON_PROVEEDOR", nombre: "Por conseguir con proveedor" },
  { id: 3, codigo: "CONFIRMADO", nombre: "Confirmado" },
  { id: 4, codigo: "ENVIADO", nombre: "Enviado" },
  { id: 5, codigo: "ENTREGADO", nombre: "Entregado" },
  { id: 6, codigo: "CANCELADO", nombre: "Cancelado" },
] as const;

export type CodigoEstadoPedido = (typeof ESTADOS_PEDIDO)[number]["codigo"];

const POR_CODIGO = new Map<string, number>(ESTADOS_PEDIDO.map((e) => [e.codigo, e.id]));
const POR_ID = new Map<number, CodigoEstadoPedido>(ESTADOS_PEDIDO.map((e) => [e.id, e.codigo]));

export function idDeEstado(codigo: CodigoEstadoPedido) {
  return POR_CODIGO.get(codigo) as number;
}

export function codigoDeEstado(id: number) {
  return POR_ID.get(id) as CodigoEstadoPedido;
}

/**
 * Tabla 2 del SRS: a qué estados puede pasar un pedido (REQ-GPE-5).
 * Entregado y Cancelado son finales. Desde Enviado ya no se puede cancelar.
 */
export const TRANSICIONES: Record<CodigoEstadoPedido, readonly CodigoEstadoPedido[]> = {
  RECIBIDO: ["CONFIRMADO", "CANCELADO"],
  POR_CONSEGUIR_CON_PROVEEDOR: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export function puedeCambiar(desde: CodigoEstadoPedido, hacia: CodigoEstadoPedido) {
  return TRANSICIONES[desde].includes(hacia);
}

/** El estado con el que nace un pedido según el modo del reloj (REQ-PED-9). */
export function estadoInicial(modo: "DISPONIBLE" | "BAJO_PEDIDO"): CodigoEstadoPedido {
  return modo === "DISPONIBLE" ? "RECIBIDO" : "POR_CONSEGUIR_CON_PROVEEDOR";
}
