import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { obtenerAlmacen } from "@/lib/api/almacen";
import type { Sesion } from "@/lib/api/tipos";

/*
 * PUNTO DE INTEGRACIÓN: AUTENTICACIÓN DEL ADMINISTRADOR
 *
 * Hoy la sesión es simulada: una cookie con un identificador que el almacén en
 * memoria reconoce, y un único administrador de ejemplo. Todo el panel depende
 * de dos funciones de este archivo, `obtenerSesion` y `requerirSesion`, y de
 * `iniciarSesion` y `cerrarSesion` en `lib/api/auth.ts`.
 *
 * Al conectar el backend (NestJS), solo hay que reemplazar el cuerpo de estas
 * funciones para que validen la cookie o el token que emita la API. Ninguna
 * pantalla ni servicio del panel debe leer la cookie por su cuenta.
 */

export const NOMBRE_COOKIE_SESION = "omshato_sesion";
/** Duración de la sesión. El tiempo real de inactividad está por definir (TBD-17). */
const DURACION_SESION_SEGUNDOS = 60 * 60 * 2;

/** Administrador de ejemplo: el único que existe mientras no haya API (S-5 del SRS). */
export const ADMINISTRADOR_SIMULADO: Sesion = {
  idAdministrador: 1,
  nombre: "Administrador",
  correo: process.env.ADMIN_DEMO_CORREO ?? "admin@omshato.com",
};

export const CONTRASENA_SIMULADA = process.env.ADMIN_DEMO_CONTRASENA ?? "omshato-demo";

/** La sesión actual, o nulo si no hay una válida. */
export async function obtenerSesion(): Promise<Sesion | null> {
  const identificador = (await cookies()).get(NOMBRE_COOKIE_SESION)?.value;
  if (!identificador || !obtenerAlmacen().sesiones.has(identificador)) return null;
  return ADMINISTRADOR_SIMULADO;
}

/** Exige sesión. Sin ella, lleva al inicio de sesión (REQ-AUT-1). */
export async function requerirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  return sesion;
}

export async function abrirSesion() {
  const identificador = crypto.randomUUID();
  obtenerAlmacen().sesiones.add(identificador);
  (await cookies()).set(NOMBRE_COOKIE_SESION, identificador, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DURACION_SESION_SEGUNDOS,
  });
}

export async function cerrarSesionActual() {
  const almacenCookies = await cookies();
  const identificador = almacenCookies.get(NOMBRE_COOKIE_SESION)?.value;
  if (identificador) obtenerAlmacen().sesiones.delete(identificador);
  almacenCookies.delete(NOMBRE_COOKIE_SESION);
}
