import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { COOKIE_DEL_API, COOKIE_SESION, llamarApi } from "@/lib/api/cliente";
import type { Sesion } from "@/lib/api/tipos";

/*
 * La sesión del administrador la lleva el API (tabla `sesion`, con cierre por inactividad y
 * bloqueo por intentos). El navegador solo guarda aquí, en una cookie `HttpOnly` del sitio,
 * el token que el API entregó al iniciar sesión; el servidor de Next lo reenvía en cada
 * llamada. Ninguna pantalla ni servicio del panel debe leer la cookie por su cuenta: todo
 * pasa por `obtenerSesion` y `requerirSesion`, y por `iniciarSesion` y `cerrarSesion` en
 * `lib/api/auth.ts`.
 */

/** Respaldo si el API no manda `Max-Age`. */
const DURACION_POR_DEFECTO_SEGUNDOS = 60 * 60 * 12;

/**
 * La sesión actual, o nulo si no hay una válida. Se consulta una vez por solicitud aunque
 * varios componentes la pidan.
 */
export const obtenerSesion = cache(async (): Promise<Sesion | null> => {
  const hayCookie = (await cookies()).has(COOKIE_SESION);
  if (!hayCookie) return null;

  const respuesta = await llamarApi<{
    administrador: { id: number; nombre: string; correo: string };
  }>("/auth/yo", { conSesion: true });
  if (!respuesta.ok) return null;

  const { id, nombre, correo } = respuesta.dato.administrador;
  return { idAdministrador: id, nombre, correo };
});

/** Exige sesión. Sin ella, lleva al inicio de sesión (REQ-AUT-1). */
export async function requerirSesion(): Promise<Sesion> {
  const sesion = await obtenerSesion();
  if (!sesion) redirect("/admin/login");
  return sesion;
}

/**
 * Guarda el token que el API entregó al iniciar sesión. Recibe las cabeceras `Set-Cookie` de su
 * respuesta; si no trae la cookie de sesión, no hace nada y devuelve `false`.
 */
export async function abrirSesion(cookiesDelApi: string[]) {
  const cookieDeSesion = cookiesDelApi.find((cookie) => cookie.startsWith(`${COOKIE_DEL_API}=`));
  if (!cookieDeSesion) return false;

  const [par, ...atributos] = cookieDeSesion.split(";").map((parte) => parte.trim());
  const token = par.slice(COOKIE_DEL_API.length + 1);
  const maxAge = atributos
    .find((atributo) => atributo.toLowerCase().startsWith("max-age="))
    ?.split("=")[1];

  (await cookies()).set(COOKIE_SESION, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Number(maxAge) || DURACION_POR_DEFECTO_SEGUNDOS,
  });
  return true;
}

/** Cierra la sesión en el API y borra la cookie del sitio. */
export async function cerrarSesionActual() {
  // Si el API no responde, la cookie se borra igual: la persona quiere salir.
  await llamarApi("/auth/logout", { metodo: "POST", conSesion: true });
  (await cookies()).delete(COOKIE_SESION);
}
