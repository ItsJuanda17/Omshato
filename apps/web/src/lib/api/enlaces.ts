"use server";

import { obtenerAlmacen, simularLatencia } from "@/lib/api/almacen";
import type { ContactoPublico, EnlaceContacto, Resultado } from "@/lib/api/tipos";
import { requerirSesion } from "@/lib/auth/sesion";
import { resolverContacto } from "@/lib/contacto";
import { esquemaEnlaces, type DatosEnlaces } from "@/lib/validaciones/enlaces";

/** Lo que muestra el sitio público: solo los enlaces configurados y activos (REQ-CON-4). */
export async function obtenerContactoPublico(): Promise<ContactoPublico> {
  await simularLatencia(60);
  return resolverContacto(obtenerAlmacen().enlaces);
}

/** Los enlaces tal como se editan en el panel. */
export async function listarEnlacesContacto(): Promise<EnlaceContacto[]> {
  await requerirSesion();
  await simularLatencia();
  return structuredClone(obtenerAlmacen().enlaces);
}

/** Guarda los tres enlaces de contacto a la vez (CU-25). */
export async function actualizarEnlacesContacto(
  datos: DatosEnlaces,
): Promise<Resultado<EnlaceContacto[]>> {
  await requerirSesion();
  await simularLatencia(250);

  const validacion = esquemaEnlaces.safeParse(datos);
  if (!validacion.success) {
    return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: validacion.error.issues[0].message };
  }

  const { enlaces } = obtenerAlmacen();
  const tipos = { WHATSAPP: "whatsapp", INSTAGRAM: "instagram", TIKTOK: "tiktok" } as const;
  for (const enlace of enlaces) {
    const nuevo = validacion.data[tipos[enlace.tipo]];
    enlace.valor = nuevo.valor;
    enlace.activo = nuevo.activo;
  }
  return { ok: true, dato: structuredClone(enlaces) };
}
