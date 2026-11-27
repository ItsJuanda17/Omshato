"use server";

import { esquemaCambioContrasena } from "@omshato/contratos";
import { redirect } from "next/navigation";

import { llamarApi, mensajeDeError } from "@/lib/api/cliente";
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

type ResultadoCambioContrasena =
  { ok: true } | { ok: false; mensaje: string; campo?: "contrasenaActual" | "contrasenaNueva" };

/**
 * Cambia la contraseña del administrador (CU-12). El API cierra las demás sesiones y entrega un
 * token nuevo para esta, así que hay que guardarlo: con el anterior el panel dejaría de abrir.
 */
export async function cambiarContrasena(datos: {
  contrasenaActual: string;
  contrasenaNueva: string;
}): Promise<ResultadoCambioContrasena> {
  const validacion = esquemaCambioContrasena.safeParse(datos);
  if (!validacion.success) {
    const primero = validacion.error.issues[0];
    return {
      ok: false,
      mensaje: primero?.message ?? "Revisa los datos.",
      campo: primero?.path[0] === "contrasenaActual" ? "contrasenaActual" : "contrasenaNueva",
    };
  }

  const respuesta = await llamarApi("/auth/cambiar-contrasena", {
    metodo: "POST",
    cuerpo: validacion.data,
    conSesion: true,
  });

  if (!respuesta.ok) {
    if (respuesta.estado === 401) redirect("/admin/login");
    if (respuesta.error.codigo === "CONTRASENA_ACTUAL_INCORRECTA") {
      return {
        ok: false,
        mensaje: "La contraseña actual no es correcta.",
        campo: "contrasenaActual",
      };
    }
    // Cuenta bloqueada por intentos: el texto dice cuánto esperar.
    if (respuesta.estado === 429) return { ok: false, mensaje: respuesta.error.mensaje };
    if (respuesta.estado === 400) {
      return { ok: false, mensaje: mensajeDeError(respuesta.error), campo: "contrasenaNueva" };
    }
    return {
      ok: false,
      mensaje: "No pudimos cambiar la contraseña en este momento. Inténtalo de nuevo.",
    };
  }

  // Si el API no devolvió el token nuevo, la sesión anterior ya no sirve: hay que volver a entrar.
  if (!(await abrirSesion(respuesta.cabeceras.getSetCookie()))) redirect("/admin/login");
  return { ok: true };
}

/** Cierra la sesión y lleva al inicio de sesión (CU-11). */
export async function cerrarSesion() {
  await cerrarSesionActual();
  redirect("/admin/login");
}
