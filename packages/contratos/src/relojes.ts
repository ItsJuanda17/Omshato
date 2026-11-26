import { z } from "zod";

import { MODOS_RELOJ } from "./tipos.js";

/** Valores del género. El cliente aún no los define (TBD-5), así que son una propuesta. */
export const generosReloj = ["Hombre", "Mujer", "Unisex"] as const;

/** Fotos máximas por reloj, para no llenar la ficha. */
export const MAXIMO_FOTOS = 10;

/** Un texto opcional: vacío o ausente se guarda como nulo. */
const textoOpcional = (maximo: number, mensaje: string) =>
  z
    .string()
    .trim()
    .max(maximo, mensaje)
    .nullish()
    .transform((texto) => texto || null);

/**
 * Clave de una foto subida al API: carpeta `relojes/` y un nombre sin puntos ni barras, para
 * que nunca apunte fuera de ella. Que el archivo exista lo comprueba el API.
 */
export const claveFoto = z
  .string()
  .regex(/^relojes\/[\w-]+\.(png|jpe?g|webp|avif)$/i, "La foto no es una imagen válida.");

/** Lo que recibe el API para crear o editar un reloj. */
export const esquemaDatosReloj = z
  .object({
    nombre: z
      .string()
      .trim()
      .min(1, "Escribe el nombre del reloj.")
      .max(150, "El nombre es demasiado largo. Usa máximo 150 caracteres."),
    idMarca: z.number().int().positive().nullish(),
    marcaNueva: textoOpcional(80, "El nombre de la marca es demasiado largo."),
    genero: z.string().trim().min(1, "Elige un género.").max(20),
    // REQ-ADM-3: solo un entero positivo. Cero, negativos y decimales se rechazan.
    precioCop: z
      .number("El precio debe ser un número.")
      .int("El precio debe ser un entero, sin decimales.")
      .positive("El precio debe ser mayor que cero."),
    modo: z.enum(MODOS_RELOJ),
    cantidad: z.number().int().min(0, "La cantidad no puede ser negativa.").nullish(),
    plazoEstimado: textoOpcional(60, "El plazo es demasiado largo. Usa máximo 60 caracteres."),
    garantia: z
      .string()
      .trim()
      .min(1, "Escribe la garantía del reloj.")
      .max(150, "La garantía es demasiado larga. Usa máximo 150 caracteres."),
    detalleMecanica: textoOpcional(
      2000,
      "El texto es demasiado largo. Usa máximo 2000 caracteres.",
    ),
    descripcion: textoOpcional(2000, "El texto es demasiado largo. Usa máximo 2000 caracteres."),
    visible: z.boolean(),
    // La primera es la principal; el orden de la lista es el de la galería.
    fotos: z
      .array(claveFoto)
      .min(1, "Agrega al menos una foto.")
      .max(MAXIMO_FOTOS, `Puedes agregar máximo ${MAXIMO_FOTOS} fotos.`),
  })
  .superRefine((datos, contexto) => {
    if (!datos.idMarca && !datos.marcaNueva) {
      contexto.addIssue({ code: "custom", path: ["idMarca"], message: "Elige una marca." });
    }
    // REQ-ADM-4: la cantidad solo aplica a los relojes disponibles (TBD-2).
    if (datos.modo === "DISPONIBLE" && (datos.cantidad === null || datos.cantidad === undefined)) {
      contexto.addIssue({
        code: "custom",
        path: ["cantidad"],
        message: "Escribe la cantidad como un número entero, cero o mayor.",
      });
    }
  })
  .transform((datos) => ({
    ...datos,
    idMarca: datos.idMarca ?? null,
    // Cada modo guarda solo lo suyo: la cantidad es de Disponible, el plazo de Bajo pedido (TBD-7).
    cantidad: datos.modo === "DISPONIBLE" ? (datos.cantidad ?? 0) : null,
    plazoEstimado: datos.modo === "BAJO_PEDIDO" ? datos.plazoEstimado : null,
  }));

/** Lo que valida el API ya limpio: textos vacíos como nulo y cada modo con lo suyo. */
export type DatosReloj = z.output<typeof esquemaDatosReloj>;
/** Lo que el front envía: cualquiera de estos campos puede venir sin limpiar. */
export type DatosRelojEntrada = z.input<typeof esquemaDatosReloj>;

export const esquemaCambioModo = z.object({ modo: z.enum(MODOS_RELOJ) });
export const esquemaCambioVisibilidad = z.object({ visible: z.boolean() });
