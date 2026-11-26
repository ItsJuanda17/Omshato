/**
 * Los tipos del dominio viven en el paquete de contratos, que comparten el front y el API.
 * Este archivo los reexporta para que el resto del front siga importando de un solo lugar, y
 * agrega lo que solo existe aquí: la sesión del panel y la forma de los resultados.
 */
import type { PedidoPublico } from "@omshato/contratos";

export * from "@omshato/contratos";

export interface Sesion {
  idAdministrador: number;
  nombre: string;
  correo: string;
}

/** Resultado de una operación del panel. Los rechazos de negocio viajan como dato. */
export type Resultado<T> = { ok: true; dato: T } | { ok: false; codigo: string; mensaje: string };

/**
 * Resultado de registrar un pedido. Los rechazos de negocio se devuelven como dato y no como
 * excepción, para que el formulario conserve lo que escribió la persona.
 */
export type ResultadoCrearPedido =
  | { ok: true; pedido: PedidoPublico }
  | {
      ok: false;
      codigo:
        "RELOJ_NO_DISPONIBLE" | "DATOS_INVALIDOS" | "DEMASIADAS_SOLICITUDES" | "ERROR_SERVIDOR";
      mensaje: string;
    };
