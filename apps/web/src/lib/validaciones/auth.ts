import { esquemaCambioContrasena } from "@omshato/contratos";
import { z } from "zod";

export const esquemaInicioSesion = z.object({
  correo: z.string().trim().min(1, "Escribe tu correo.").email("Escribe un correo válido."),
  contrasena: z.string().min(1, "Escribe tu contraseña."),
});

export type DatosInicioSesion = z.infer<typeof esquemaInicioSesion>;

/**
 * El formulario de cambio de contraseña pide además repetir la nueva. Las reglas de fondo
 * (largo, distinta de la actual) son las de `@omshato/contratos`, las mismas que aplica el API.
 */
export const esquemaFormularioCambioContrasena = z
  .object({
    contrasenaActual: z.string(),
    contrasenaNueva: z.string(),
    confirmacion: z.string().min(1, "Repite la contraseña nueva"),
  })
  .superRefine((datos, ctx) => {
    const reglas = esquemaCambioContrasena.safeParse({
      contrasenaActual: datos.contrasenaActual,
      contrasenaNueva: datos.contrasenaNueva,
    });
    if (!reglas.success) {
      for (const problema of reglas.error.issues) {
        ctx.addIssue({ code: "custom", path: problema.path, message: problema.message });
      }
    }
    if (datos.confirmacion && datos.confirmacion !== datos.contrasenaNueva) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmacion"],
        message: "Las contraseñas no coinciden",
      });
    }
  });

export type DatosCambioContrasena = z.infer<typeof esquemaFormularioCambioContrasena>;
