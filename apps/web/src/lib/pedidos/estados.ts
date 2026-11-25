import type { EstadoPedido } from "@/lib/api/tipos";

export const etiquetasEstado: Record<EstadoPedido, string> = {
  RECIBIDO: "Recibido",
  POR_CONSEGUIR_CON_PROVEEDOR: "Por conseguir con proveedor",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/** Orden en que se muestran los estados en los filtros. */
export const estadosEnOrden: EstadoPedido[] = [
  "RECIBIDO",
  "POR_CONSEGUIR_CON_PROVEEDOR",
  "CONFIRMADO",
  "ENVIADO",
  "ENTREGADO",
  "CANCELADO",
];

/**
 * Tabla 2 del SRS: a qué estados puede pasar un pedido (REQ-GPE-5).
 * Entregado y Cancelado son finales. Desde Enviado ya no se puede cancelar.
 */
export const transiciones: Record<EstadoPedido, EstadoPedido[]> = {
  RECIBIDO: ["CONFIRMADO", "CANCELADO"],
  POR_CONSEGUIR_CON_PROVEEDOR: ["CONFIRMADO", "CANCELADO"],
  CONFIRMADO: ["ENVIADO", "CANCELADO"],
  ENVIADO: ["ENTREGADO"],
  ENTREGADO: [],
  CANCELADO: [],
};

export function puedeCambiar(desde: EstadoPedido, hacia: EstadoPedido) {
  return transiciones[desde].includes(hacia);
}

export const esEstadoFinal = (estado: EstadoPedido) => transiciones[estado].length === 0;
