import { z } from "zod";

import { normalizarWhatsapp } from "@/lib/contacto/enlaces";

/**
 * Enlaces de contacto (REQ-CON-5). Un enlace puede quedar vacío; si está activo,
 * tiene que ser válido. El formato del teléfono está por confirmar (TBD-21).
 */

const url = (dominio: RegExp, ejemplo: string) =>
  z
    .string()
    .trim()
    .refine(
      (valor) => valor === "" || (/^https:\/\//i.test(valor) && dominio.test(valor)),
      `Escribe la dirección completa del perfil, por ejemplo ${ejemplo}.`,
    );

const enlace = <T extends z.ZodType<string>>(valor: T) => z.object({ valor, activo: z.boolean() });

export const esquemaEnlaces = z
  .object({
    whatsapp: enlace(
      z
        .string()
        .trim()
        .refine(
          (valor) => valor === "" || normalizarWhatsapp(valor) !== null,
          "Escribe un número válido, con 10 dígitos o con indicativo de país.",
        ),
    ),
    instagram: enlace(url(/instagram\.com\//i, "https://www.instagram.com/omsha_to")),
    tiktok: enlace(url(/tiktok\.com\//i, "https://www.tiktok.com/@omsha_to")),
  })
  .superRefine((datos, contexto) => {
    for (const clave of ["whatsapp", "instagram", "tiktok"] as const) {
      if (datos[clave].activo && datos[clave].valor === "") {
        contexto.addIssue({
          code: "custom",
          path: [clave, "valor"],
          message: "Escribe el dato o desactiva este enlace.",
        });
      }
    }
  });

export type DatosEnlaces = z.infer<typeof esquemaEnlaces>;
