import {
  direccionEntrega,
  MENSAJE_ACEPTAR_POLITICA,
  motivoCancelacion,
  nombreComprador,
  telefonoComprador,
  textoNota,
} from "@omshato/contratos";
import { z } from "zod";

/**
 * Las reglas del pedido sin registro (REQ-PED-2 a REQ-PED-6) son del paquete de contratos: el
 * API aplica las mismas y la validación del servidor es la que cuenta. Aquí solo se arma el
 * formulario, que entrega selectores como texto.
 */

/** Lo que escribe la persona. Los selectores entregan texto. */
export const esquemaFormularioPedido = z.object({
  nombre: nombreComprador,
  telefono: telefonoComprador,
  departamento: z.string().min(1, "Elige un departamento."),
  ciudad: z.string().min(1, "Elige una ciudad."),
  direccion: direccionEntrega,
  // El checkbox entrega un booleano; el API exige que sea verdadero.
  aceptaPolitica: z.boolean().refine((valor) => valor, MENSAJE_ACEPTAR_POLITICA),
});

export type DatosFormularioPedido = z.infer<typeof esquemaFormularioPedido>;

/** REQ-GPE-6: cancelar exige un motivo breve. */
export const esquemaMotivoCancelacion = motivoCancelacion;

/** REQ-GPE-11: nota interna de un pedido. */
export const esquemaNota = textoNota;
