import type { EstadoPedido } from "./tipos.js";

export const etiquetasEstado: Record<EstadoPedido, string> = {
  RECIBIDO: "Recibido",
  POR_CONSEGUIR_CON_PROVEEDOR: "Por conseguir con proveedor",
  CONFIRMADO: "Confirmado",
  ENVIADO: "Enviado",
  ENTREGADO: "Entregado",
  CANCELADO: "Cancelado",
};

/**
 * Tabla 2 del SRS: a qué estados puede pasar un pedido (REQ-GPE-5).
 * Entregado y Cancelado son finales. Desde Enviado ya no se puede cancelar.
 */
export const transiciones: Record<EstadoPedido, readonly EstadoPedido[]> = {
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

/** El estado con el que nace un pedido según el modo del reloj (REQ-PED-9). */
export function estadoInicial(modo: "DISPONIBLE" | "BAJO_PEDIDO"): EstadoPedido {
  return modo === "DISPONIBLE" ? "RECIBIDO" : "POR_CONSEGUIR_CON_PROVEEDOR";
}
