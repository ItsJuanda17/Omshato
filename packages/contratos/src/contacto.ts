import { z } from "zod";

import type { ContactoPublico, TipoEnlace } from "./tipos.js";

/** Lo mínimo de un enlace para resolver el contacto público. */
export interface EnlaceGuardado {
  tipo: TipoEnlace;
  valor: string;
  activo: boolean;
}

/**
 * Deja solo los dígitos y agrega el indicativo de Colombia a un celular de 10.
 * Devuelve nulo si no parece un número de teléfono (TBD-21: formato por confirmar).
 */
export function normalizarWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 10) {
    return `57${digitos}`;
  }
  return digitos.length >= 11 && digitos.length <= 15 ? digitos : null;
}

/** "573001234567" pasa a "+57 300 123 4567". */
function telefonoVisible(numero: string) {
  const colombiano = /^57(\d{3})(\d{3})(\d{4})$/.exec(numero);
  return colombiano ? `+57 ${colombiano[1]} ${colombiano[2]} ${colombiano[3]}` : `+${numero}`;
}

/** El nombre de usuario sale del último tramo de la dirección del perfil. */
function usuarioDePerfil(url: string) {
  const tramo = url.split("?")[0].split("/").filter(Boolean).pop() ?? url;
  return tramo.replace(/^@/, "");
}

/**
 * Convierte los enlaces guardados en lo que muestra el sitio público. Un tipo sin enlace
 * activo y con valor llega como nulo, y el sitio no muestra su icono (REQ-CON-4).
 */
export function resolverContacto(enlaces: EnlaceGuardado[]): ContactoPublico {
  const activo = (tipo: TipoEnlace) =>
    enlaces.find((e) => e.tipo === tipo && e.activo && e.valor.trim() !== "")?.valor.trim() ?? null;

  const whatsapp = activo("WHATSAPP");
  const numero = whatsapp ? normalizarWhatsapp(whatsapp) : null;
  const instagram = activo("INSTAGRAM");
  const tiktok = activo("TIKTOK");

  return {
    whatsapp: numero ? { numero, visible: telefonoVisible(numero) } : null,
    instagram: instagram ? { url: instagram, usuario: usuarioDePerfil(instagram) } : null,
    tiktok: tiktok ? { url: tiktok, usuario: usuarioDePerfil(tiktok) } : null,
  };
}

/**
 * Enlaces de contacto (REQ-CON-5). Un enlace puede quedar vacío; si está activo, tiene que
 * ser válido. El formato del teléfono está por confirmar (TBD-21).
 */
const perfil = (dominio: RegExp, ejemplo: string) =>
  z
    .string()
    .trim()
    .max(255)
    .refine(
      (valor) => valor === "" || (/^https:\/\//i.test(valor) && dominio.test(valor)),
      `Escribe la dirección completa del perfil, por ejemplo ${ejemplo}.`,
    );

const enlace = (valor: z.ZodType<string>) => z.object({ valor, activo: z.boolean() });

export const esquemaEnlaces = z
  .object({
    whatsapp: enlace(
      z
        .string()
        .trim()
        .max(255)
        .refine(
          (valor) => valor === "" || normalizarWhatsapp(valor) !== null,
          "Escribe un número válido, con 10 dígitos o con indicativo de país.",
        ),
    ),
    instagram: enlace(perfil(/instagram\.com\//i, "https://www.instagram.com/omsha_to")),
    tiktok: enlace(perfil(/tiktok\.com\//i, "https://www.tiktok.com/@omsha_to")),
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
