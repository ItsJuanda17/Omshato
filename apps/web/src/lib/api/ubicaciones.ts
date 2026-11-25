"use server";

import { obtenerAlmacen, simularLatencia } from "@/lib/api/mock/almacen";
import type { Ciudad, Departamento } from "@/lib/api/tipos";

/** Lista de Colombia para el formulario de pedido (REQ-PED-5). */
export async function listarDepartamentos(): Promise<Departamento[]> {
  await simularLatencia();
  return obtenerAlmacen().departamentos.toSorted((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/** Todas las ciudades. El formulario filtra por departamento en el navegador. */
export async function listarCiudades(): Promise<Ciudad[]> {
  await simularLatencia();
  return obtenerAlmacen().ciudades.toSorted((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}
