import { z } from "zod";

/**
 * Reglas del pedido sin registro (REQ-PED-2 a REQ-PED-6). El formulario y el
 * servicio usan las mismas, porque la validación del servidor es la que cuenta
 * y la del navegador solo adelanta los mensajes.
 */

const nombre = z
  .string()
  .trim()
  .min(1, "Escribe tu nombre y apellidos.")
  .max(120, "El nombre es demasiado largo. Usa máximo 120 caracteres.");

// REQ-PED-3: solo dígitos y 10 de longitud, propio de un celular colombiano (TBD-21).
const telefono = z
  .string()
  .regex(/^\d{10}$/, "Escribe un celular colombiano de 10 dígitos, solo números.");

const direccion = z
  .string()
  .trim()
  .min(1, "Escribe la dirección de entrega.")
  .max(250, "La dirección es demasiado larga. Usa máximo 250 caracteres.");

const aceptaPolitica = z
  .boolean()
  .refine(
    (valor) => valor,
    "Debes aceptar la política de tratamiento de datos personales para continuar.",
  );

/** Lo que escribe la persona. Los selectores entregan texto. */
export const esquemaFormularioPedido = z.object({
  nombre,
  telefono,
  departamento: z.string().min(1, "Elige un departamento."),
  ciudad: z.string().min(1, "Elige una ciudad."),
  direccion,
  aceptaPolitica,
});

export type DatosFormularioPedido = z.infer<typeof esquemaFormularioPedido>;

/** REQ-GPE-6: cancelar exige un motivo breve. */
export const esquemaMotivoCancelacion = z
  .string()
  .trim()
  .min(1, "Escribe el motivo de la cancelación.")
  .max(250, "El motivo es demasiado largo. Usa máximo 250 caracteres.");

/** REQ-GPE-11: nota interna de un pedido. */
export const esquemaNota = z
  .string()
  .trim()
  .min(1, "Escribe la nota antes de guardarla.")
  .max(1000, "La nota es demasiado larga. Usa máximo 1000 caracteres.");

/** Lo que recibe el servicio de pedidos. */
export const esquemaNuevoPedido = z.object({
  idReloj: z.number().int().positive(),
  nombreComprador: nombre,
  telefonoComprador: telefono,
  idCiudad: z.number().int().positive(),
  direccion,
  aceptaPolitica,
  /** Evita registrar dos veces el mismo envío (REQ-PED-12). */
  claveIdempotencia: z.string().min(8).max(64),
});

export type NuevoPedido = z.infer<typeof esquemaNuevoPedido>;
