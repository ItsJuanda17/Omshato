"use server";

import { ejecutarApi } from "@/lib/api/cliente";
import type { Resultado } from "@/lib/api/tipos";

/**
 * Sube una foto de reloj y devuelve su clave, que luego se envía al crear o editar el reloj.
 * El API decide si es una imagen por su contenido y rechaza las de más de 5 MB.
 */
export async function subirFoto(formulario: FormData): Promise<Resultado<string>> {
  const foto = formulario.get("foto");
  if (!(foto instanceof File) || foto.size === 0) {
    return { ok: false, codigo: "FOTO_REQUERIDA", mensaje: "Elige una foto para subir." };
  }

  const resultado = await ejecutarApi<{ archivo: string }>("/admin/fotos", {
    metodo: "POST",
    formulario,
    conSesion: true,
  });
  return resultado.ok ? { ok: true, dato: resultado.dato.archivo } : resultado;
}
