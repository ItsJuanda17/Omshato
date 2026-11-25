"use server";

/**
 * Servicio de relojes. Hoy responde con datos en memoria.
 *
 * Todo `lib/api` se marca como "use server": así las mismas funciones se llaman
 * desde componentes de servidor y desde componentes de cliente (el panel), y
 * ambos ven el mismo almacén. Al conectar el backend se quita la directiva y
 * el cuerpo de cada función pasa a ser una llamada HTTP, sin cambiar firmas.
 */

import { obtenerAlmacen, simularLatencia } from "@/lib/api/almacen";
import type { Marca, Reloj, RelojResumen } from "@/lib/api/tipos";

/**
 * Catálogo público: solo relojes visibles, del más reciente al más antiguo
 * (REQ-CAT-1 y REQ-CAT-3).
 */
export async function listarRelojes(): Promise<RelojResumen[]> {
  await simularLatencia();
  return obtenerAlmacen()
    .relojes.filter((reloj) => reloj.visible)
    .toSorted((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion))
    .map((reloj) => ({
      id: reloj.id,
      marca: reloj.marca,
      nombre: reloj.nombre,
      precioCop: reloj.precioCop,
      modo: reloj.modo,
      urlAmigable: reloj.urlAmigable,
      imagenPrincipal: reloj.imagenes.find((imagen) => imagen.esPrincipal) ?? reloj.imagenes[0],
    }));
}

/** Marcas que tienen al menos un reloj visible, para el filtro (REQ-FIL-2). */
export async function listarMarcas(): Promise<Marca[]> {
  await simularLatencia();
  const { relojes } = obtenerAlmacen();
  const conRelojes = new Set(relojes.filter((r) => r.visible).map((r) => r.marca.id));
  return obtenerAlmacen()
    .marcas.filter((marca) => conRelojes.has(marca.id))
    .toSorted((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/**
 * Ficha pública. Devuelve nulo si el reloj no existe o está oculto: la página
 * no debe revelar nada de un reloj retirado (REQ-DET-6).
 */
export async function obtenerReloj(urlAmigable: string): Promise<Reloj | null> {
  await simularLatencia();
  const reloj = obtenerAlmacen().relojes.find((r) => r.urlAmigable === urlAmigable && r.visible);
  return reloj ? structuredClone(reloj) : null;
}
