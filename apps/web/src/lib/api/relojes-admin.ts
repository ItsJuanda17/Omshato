"use server";

/**
 * Servicio de relojes del panel. A diferencia del catálogo público, ve todos los relojes,
 * visibles y ocultos. Todo exige sesión (REQ-AUT-1): sin ella, el API responde 401 y el
 * cliente lleva al inicio de sesión.
 */

import { ejecutarApi, leerApi } from "@/lib/api/cliente";
import type { DatosRelojEntrada, Marca, ModoReloj, RelojAdmin, Resultado } from "@/lib/api/tipos";

/** Todos los relojes, visibles y ocultos, del más reciente al más antiguo (REQ-ADM-11). */
export async function listarRelojesAdmin(): Promise<RelojAdmin[]> {
  return leerApi<RelojAdmin[]>("/admin/relojes", { conSesion: true });
}

export async function obtenerRelojAdmin(idReloj: number): Promise<RelojAdmin | null> {
  return leerApi<RelojAdmin>(`/admin/relojes/${idReloj}`, {
    conSesion: true,
    nuloSiNoExiste: true,
  });
}

/** Todas las marcas, para elegir una existente al crear un reloj (REQ-ADM-12). */
export async function listarMarcasAdmin(): Promise<Marca[]> {
  return leerApi<Marca[]>("/admin/marcas", { conSesion: true });
}

/** Agrega un reloj. Si está visible, se publica de inmediato (CU-13). */
export async function crearReloj(datos: DatosRelojEntrada): Promise<Resultado<RelojAdmin>> {
  return ejecutarApi<RelojAdmin>("/admin/relojes", {
    metodo: "POST",
    cuerpo: datos,
    conSesion: true,
  });
}

/**
 * Modifica un reloj. Los pedidos ya registrados no cambian, porque guardan su propia copia
 * del nombre y el precio (SEF-3). La URL se mantiene estable.
 */
export async function actualizarReloj(
  idReloj: number,
  datos: DatosRelojEntrada,
): Promise<Resultado<RelojAdmin>> {
  return ejecutarApi<RelojAdmin>(`/admin/relojes/${idReloj}`, {
    metodo: "PUT",
    cuerpo: datos,
    conSesion: true,
  });
}

/** Cambia el modo sin abrir el formulario (CU-15, REQ-ADM-6). */
export async function cambiarModoReloj(
  idReloj: number,
  modo: ModoReloj,
): Promise<Resultado<RelojAdmin>> {
  return ejecutarApi<RelojAdmin>(`/admin/relojes/${idReloj}/modo`, {
    metodo: "PATCH",
    cuerpo: { modo },
    conSesion: true,
  });
}

/** Oculta o muestra un reloj sin borrarlo (CU-16, REQ-ADM-7). */
export async function cambiarVisibilidadReloj(
  idReloj: number,
  visible: boolean,
): Promise<Resultado<RelojAdmin>> {
  return ejecutarApi<RelojAdmin>(`/admin/relojes/${idReloj}/visibilidad`, {
    metodo: "PATCH",
    cuerpo: { visible },
    conSesion: true,
  });
}

/** Elimina un reloj solo si no tiene pedidos asociados (CU-17, RN-8, REQ-ADM-8). */
export async function eliminarReloj(idReloj: number): Promise<Resultado<null>> {
  return ejecutarApi<null>(`/admin/relojes/${idReloj}`, { metodo: "DELETE", conSesion: true });
}
