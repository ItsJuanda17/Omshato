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
