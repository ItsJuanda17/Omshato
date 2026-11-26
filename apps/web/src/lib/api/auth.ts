"use server";

import { redirect } from "next/navigation";

import { llamarApi } from "@/lib/api/cliente";
import { abrirSesion, cerrarSesionActual } from "@/lib/auth/sesion";
import { esquemaInicioSesion } from "@/lib/validaciones/auth";

type ResultadoInicioSesion = { ok: true } | { ok: false; mensaje: string };

const MENSAJE_GENERICO = "Correo o contraseña incorrectos";

/**
 * Inicia la sesión del administrador. Ante credenciales inválidas responde siempre lo mismo,
 * sin indicar cuál dato falló (REQ-AUT-3). El bloqueo tras varios intentos fallidos
 * (REQ-AUT-4) y el límite de solicitudes por IP los aplica el API.
 */
export async function iniciarSesion(datos: {
  correo: string;
  contrasena: string;
}): Promise<ResultadoInicioSesion> {
  const validacion = esquemaInicioSesion.safeParse(datos);
  if (!validacion.success) return { ok: false, mensaje: MENSAJE_GENERICO };

  const respuesta = await llamarApi("/auth/login", {
    metodo: "POST",
    cuerpo: validacion.data,
    reenviarIp: true,
  });

  if (!respuesta.ok) {
    // El bloqueo y el límite de solicitudes traen un texto que explica cuánto esperar.
    if (respuesta.estado === 429) return { ok: false, mensaje: respuesta.error.mensaje };
    if (respuesta.estado === 401) return { ok: false, mensaje: MENSAJE_GENERICO };
    return {
      ok: false,
      mensaje: "No pudimos iniciar sesión en este momento. Inténtalo de nuevo en unos minutos.",
    };
  }

  const abierta = await abrirSesion(respuesta.cabeceras.getSetCookie());
  if (!abierta) {
    return { ok: false, mensaje: "No pudimos iniciar sesión en este momento. Inténtalo de nuevo." };
  }
  return { ok: true };
}

/** Cierra la sesión y lleva al inicio de sesión (CU-11). */
export async function cerrarSesion() {
  await cerrarSesionActual();
  redirect("/admin/login");
}
