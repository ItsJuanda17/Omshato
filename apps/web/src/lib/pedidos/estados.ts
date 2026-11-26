/**
 * Las etiquetas, el orden y las transiciones de los estados del pedido (Tabla 2 del SRS) son del
 * paquete de contratos: el API las aplica y el panel las usa para saber qué botones ofrecer.
 */
export {
  CODIGOS_ESTADO_PEDIDO as estadosEnOrden,
  etiquetasEstado,
  puedeCambiar,
  transiciones,
} from "@omshato/contratos";
