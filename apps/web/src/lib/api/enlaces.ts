"use server";

import { ejecutarApi, leerApi } from "@/lib/api/cliente";
import type { ContactoPublico, DatosEnlaces, EnlaceContacto, Resultado } from "@/lib/api/tipos";

/** Lo que muestra el sitio público: solo los enlaces configurados y activos (REQ-CON-4). */
export async function obtenerContactoPublico(): Promise<ContactoPublico> {
  return leerApi<ContactoPublico>("/contacto");
}

/** Los enlaces tal como se editan en el panel. */
export async function listarEnlacesContacto(): Promise<EnlaceContacto[]> {
  return leerApi<EnlaceContacto[]>("/admin/contacto", { conSesion: true });
}

/** Guarda los tres enlaces de contacto a la vez (CU-25). */
export async function actualizarEnlacesContacto(
  datos: DatosEnlaces,
): Promise<Resultado<EnlaceContacto[]>> {
  return ejecutarApi<EnlaceContacto[]>("/admin/contacto", {
    metodo: "PUT",
    cuerpo: datos,
    conSesion: true,
  });
}
