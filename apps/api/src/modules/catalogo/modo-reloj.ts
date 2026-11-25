/** RN-1: un reloj está en exactamente uno de dos modos. */
export const MODOS_RELOJ = ["DISPONIBLE", "BAJO_PEDIDO"] as const;
export type ModoReloj = (typeof MODOS_RELOJ)[number];
