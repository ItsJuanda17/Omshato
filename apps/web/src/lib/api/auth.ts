"use server";

import { redirect } from "next/navigation";

import { obtenerAlmacen, simularLatencia } from "@/lib/api/mock/almacen";
import {
  ADMINISTRADOR_SIMULADO,
  CONTRASENA_SIMULADA,
  abrirSesion,
  cerrarSesionActual,
} from "@/lib/auth/sesion";
import { esquemaInicioSesion } from "@/lib/validaciones/auth";

// Valores de referencia que dependen del cliente (TBD-17).
const INTENTOS_MAXIMOS = 5;
const BLOQUEO_MILISEGUNDOS = 15 * 60 * 1000;

type ResultadoInicioSesion = { ok: true } | { ok: false; mensaje: string };

/**
 * Inicia la sesión del administrador (REQ-AUT-2). Ante credenciales inválidas
 * responde siempre lo mismo, sin indicar cuál dato falló (REQ-AUT-3).
 */
export async function iniciarSesion(datos: {
  correo: string;
  contrasena: string;
}): Promise<ResultadoInicioSesion> {
  await simularLatencia(300);
  const mensajeGenerico = { ok: false, mensaje: "Correo o contraseña incorrectos" } as const;

  const validacion = esquemaInicioSesion.safeParse(datos);
  if (!validacion.success) return mensajeGenerico;
  const { correo, contrasena } = validacion.data;

  const intentos = obtenerAlmacen().intentosSesion;
  const clave = correo.toLowerCase();
  const estado = intentos.get(clave) ?? { intentos: 0, bloqueadoHasta: null };

  // REQ-AUT-4: bloqueo temporal tras varios intentos fallidos seguidos.
  if (estado.bloqueadoHasta && estado.bloqueadoHasta > Date.now()) {
    return { ok: false, mensaje: "Demasiados intentos. Inténtalo de nuevo en unos minutos." };
  }

  const correcta =
    clave === ADMINISTRADOR_SIMULADO.correo.toLowerCase() && contrasena === CONTRASENA_SIMULADA;

  if (!correcta) {
    const fallidos = estado.intentos + 1;
    intentos.set(clave, {
      intentos: fallidos,
      bloqueadoHasta: fallidos >= INTENTOS_MAXIMOS ? Date.now() + BLOQUEO_MILISEGUNDOS : null,
    });
    return mensajeGenerico;
  }

  intentos.delete(clave);
  await abrirSesion();
  return { ok: true };
}

/** Cierra la sesión y lleva al inicio de sesión (CU-11). */
export async function cerrarSesion() {
  await cerrarSesionActual();
  redirect("/admin/login");
}
