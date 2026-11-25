"use client";

import { useMemo, useSyncExternalStore } from "react";

import type { Pedido } from "@/lib/api/tipos";

/**
 * El último pedido se guarda en la sesión del navegador y la confirmación lo lee
 * de ahí. Así los datos personales del comprador no viajan en la URL ni hay un
 * enlace público que los consulte por número de pedido (SEI-4).
 */
const CLAVE = "omshato:pedido-reciente";

export function guardarPedidoReciente(pedido: Pedido) {
  window.sessionStorage.setItem(CLAVE, JSON.stringify(pedido));
}

const sinSuscripcion = () => () => {};

/**
 * - `undefined`: todavía se está leyendo (primer render en el servidor).
 * - `null`: no hay pedido reciente en esta sesión.
 */
export function usePedidoReciente(): Pedido | null | undefined {
  const texto = useSyncExternalStore(
    sinSuscripcion,
    () => window.sessionStorage.getItem(CLAVE),
    () => undefined,
  );
  return useMemo(() => {
    if (texto === undefined) return undefined;
    return texto ? (JSON.parse(texto) as Pedido) : null;
  }, [texto]);
}
