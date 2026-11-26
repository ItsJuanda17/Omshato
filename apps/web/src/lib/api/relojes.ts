"use server";

/**
 * Servicio de relojes del catálogo público. Llama al API; el navegador nunca habla con él.
 * Todo `lib/api` se marca como "use server": las mismas funciones se llaman desde componentes
 * de servidor y desde componentes de cliente (el panel).
 */

import { leerApi } from "@/lib/api/cliente";
import type { Marca, Reloj, RelojResumen } from "@/lib/api/tipos";

/** Catálogo público: solo relojes visibles, del más reciente al más antiguo (REQ-CAT-1, REQ-CAT-3). */
export async function listarRelojes(): Promise<RelojResumen[]> {
  return leerApi<RelojResumen[]>("/relojes");
}

/** Marcas que tienen al menos un reloj visible, para el filtro (REQ-FIL-2). */
export async function listarMarcas(): Promise<Marca[]> {
  return leerApi<Marca[]>("/marcas");
}

/**
 * Ficha pública. Devuelve nulo si el reloj no existe o está oculto: la página no debe revelar
 * nada de un reloj retirado (REQ-DET-6).
 */
export async function obtenerReloj(urlAmigable: string): Promise<Reloj | null> {
  return leerApi<Reloj>(`/relojes/${encodeURIComponent(urlAmigable)}`, { nuloSiNoExiste: true });
}
