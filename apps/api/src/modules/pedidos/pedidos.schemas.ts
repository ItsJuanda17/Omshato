import { z } from "zod";

import { ESTADOS_PEDIDO } from "./estados-pedido.js";

const CODIGOS_ESTADO = ESTADOS_PEDIDO.map((estado) => estado.codigo) as [
  (typeof ESTADOS_PEDIDO)[number]["codigo"],
  ...(typeof ESTADOS_PEDIDO)[number]["codigo"][],
];

/** REQ-PED-2 a REQ-PED-6: lo que pide el formulario de un pedido sin registro. */
export const esquemaNuevoPedido = z.object({
  idReloj: z.number().int().positive(),
  nombreComprador: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre y apellidos.")
    .max(120, "El nombre es demasiado largo. Usa máximo 120 caracteres."),
  // REQ-PED-3: solo dígitos y 10 de longitud, propio de un celular colombiano (TBD-21).
  telefonoComprador: z
    .string()
    .regex(/^\d{10}$/, "Escribe un celular colombiano de 10 dígitos, solo números."),
  idCiudad: z.number().int().positive(),
  direccion: z
    .string()
    .trim()
    .min(1, "Escribe la dirección de entrega.")
    .max(250, "La dirección es demasiado larga. Usa máximo 250 caracteres."),
  // REQ-PED-6: sin aceptar la política no hay pedido. El servidor pone la fecha, no el cliente.
  aceptaPolitica: z.literal(
    true,
    "Debes aceptar la política de tratamiento de datos personales para continuar.",
  ),
  /** Evita registrar dos veces el mismo envío (REQ-PED-12). Lo genera el navegador. */
  claveIdempotencia: z
    .string()
    .min(8, "La clave de envío no es válida.")
    .max(64, "La clave de envío no es válida.")
    .regex(/^[\w-]+$/, "La clave de envío no es válida."),
});

export type NuevoPedido = z.infer<typeof esquemaNuevoPedido>;

/** REQ-GPE-5 y REQ-GPE-6: cambiar el estado; cancelar exige un motivo breve. */
export const esquemaCambioEstado = z
  .object({
    estado: z.enum(CODIGOS_ESTADO),
    motivo: z
      .string()
      .trim()
      .max(250, "El motivo es demasiado largo. Usa máximo 250 caracteres.")
      .nullish(),
  })
  .superRefine((datos, contexto) => {
    if (datos.estado === "CANCELADO" && !datos.motivo) {
      contexto.addIssue({
        code: "custom",
        path: ["motivo"],
        message: "Escribe el motivo de la cancelación.",
      });
    }
  });

export type CambioEstado = z.infer<typeof esquemaCambioEstado>;

/** REQ-GPE-11: nota interna de un pedido. */
export const esquemaNota = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "Escribe la nota antes de guardarla.")
    .max(1000, "La nota es demasiado larga. Usa máximo 1000 caracteres."),
});

export type NuevaNota = z.infer<typeof esquemaNota>;
