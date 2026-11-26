import { MAXIMO_FOTOS } from "@omshato/contratos";
import { z } from "zod";

/**
 * Lo que el administrador escribe en el formulario del reloj. Los campos numéricos y los
 * selectores entregan texto; el formulario los convierte en lo que recibe el API, que es quien
 * valida de verdad (`esquemaDatosReloj`, en el paquete de contratos). Aquí solo se adelantan
 * los mensajes junto a cada campo.
 */

export { generosReloj } from "@omshato/contratos";

/** Valor del selector de marca que abre el campo para escribir una marca nueva. */
export const MARCA_NUEVA = "nueva";

// REQ-ADM-3: solo un entero positivo. Se rechazan cero, negativos, decimales y texto.
const precio = z
  .string()
  .trim()
  .regex(
    /^[1-9]\d*$/,
    "Escribe el precio como un número entero mayor que cero, sin puntos, comas ni decimales.",
  );

const nombre = z
  .string()
  .trim()
  .min(1, "Escribe el nombre del reloj.")
  .max(150, "El nombre es demasiado largo. Usa máximo 150 caracteres.");

const garantia = z
  .string()
  .trim()
  .min(1, "Escribe la garantía del reloj.")
  .max(150, "La garantía es demasiado larga. Usa máximo 150 caracteres.");

const genero = z.string().trim().min(1, "Elige un género.").max(20);
const textoLargo = z
  .string()
  .trim()
  .max(2000, "El texto es demasiado largo. Usa máximo 2000 caracteres.");
const plazo = z.string().trim().max(60, "El plazo es demasiado largo. Usa máximo 60 caracteres.");

export const esquemaFormularioReloj = z
  .object({
    nombre,
    marca: z.string().min(1, "Elige una marca."),
    marcaNueva: z.string().trim().max(80, "El nombre de la marca es demasiado largo."),
    genero,
    precio,
    modo: z.enum(["DISPONIBLE", "BAJO_PEDIDO"]),
    cantidad: z.string().trim(),
    plazoEstimado: plazo,
    garantia,
    detalleMecanica: textoLargo,
    descripcion: textoLargo,
    visible: z.boolean(),
    /** Claves de las fotos ya subidas, en orden. La primera es la principal. */
    fotos: z
      .array(z.string())
      .min(1, "Agrega al menos una foto.")
      .max(MAXIMO_FOTOS, `Puedes agregar máximo ${MAXIMO_FOTOS} fotos.`),
  })
  .superRefine((datos, contexto) => {
    if (datos.marca === MARCA_NUEVA && !datos.marcaNueva) {
      contexto.addIssue({
        code: "custom",
        path: ["marcaNueva"],
        message: "Escribe el nombre de la marca.",
      });
    }
    // REQ-ADM-4: la cantidad solo aplica a los relojes disponibles (TBD-2).
    if (datos.modo === "DISPONIBLE" && !/^\d+$/.test(datos.cantidad)) {
      contexto.addIssue({
        code: "custom",
        path: ["cantidad"],
        message: "Escribe la cantidad como un número entero, cero o mayor.",
      });
    }
  });

export type DatosFormularioReloj = z.infer<typeof esquemaFormularioReloj>;
