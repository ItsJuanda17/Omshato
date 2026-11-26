import { applyDecorators, UseGuards } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";

/**
 * Limita cuántas veces una misma IP puede llamar a esta ruta dentro de una ventana (SEI-8).
 * Es de las rutas que cualquiera puede llamar y que cuestan algo: el inicio de sesión y el
 * pedido. No se aplica a todo el API porque el sitio público lo consulta el servidor del
 * front, y ahí muchos visitantes llegarían con una sola IP. Al pasarse del límite responde
 * 429 `DEMASIADAS_SOLICITUDES` con la cabecera `Retry-After`.
 */
export function LimitarSolicitudes(limite: number, ventanaMinutos: number) {
  return applyDecorators(
    UseGuards(ThrottlerGuard),
    Throttle({ default: { limit: limite, ttl: ventanaMinutos * 60_000 } }),
  );
}
