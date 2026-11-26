"use server";

import { leerApi } from "@/lib/api/cliente";
import type { Ciudad, Departamento } from "@/lib/api/tipos";

/** Los departamentos y municipios de Colombia casi no cambian: se reutilizan por un día. */
const UN_DIA = 60 * 60 * 24;

/** Lista de Colombia para el formulario de pedido (REQ-PED-5). */
export async function listarDepartamentos(): Promise<Departamento[]> {
  return leerApi<Departamento[]>("/ubicaciones/departamentos", { revalidar: UN_DIA });
}

/** Todas las ciudades. El formulario filtra por departamento en el navegador. */
export async function listarCiudades(): Promise<Ciudad[]> {
  return leerApi<Ciudad[]>("/ubicaciones/ciudades", { revalidar: UN_DIA });
}
