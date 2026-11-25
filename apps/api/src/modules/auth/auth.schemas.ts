import { z } from "zod";

/** Largo mínimo de la contraseña nueva. Valor de referencia hasta que el cliente fije su política. */
export const LARGO_MINIMO_CONTRASENA = 10;
/** El hash admite hasta 4 KiB; 128 caracteres sobra y evita pedirle trabajo inútil al servidor. */
export const LARGO_MAXIMO_CONTRASENA = 128;

export const esquemaInicioSesion = z.object({
  correo: z.string().trim().min(1, "Escribe tu correo").max(254),
  // Sin reglas de formato: una contraseña mal escrita debe fallar como credencial, no como dato.
  contrasena: z.string().min(1, "Escribe tu contraseña").max(LARGO_MAXIMO_CONTRASENA),
});

export const esquemaCambioContrasena = z
  .object({
    contrasenaActual: z
      .string()
      .min(1, "Escribe tu contraseña actual")
      .max(LARGO_MAXIMO_CONTRASENA),
    contrasenaNueva: z
      .string()
      .min(LARGO_MINIMO_CONTRASENA, `Debe tener al menos ${LARGO_MINIMO_CONTRASENA} caracteres`)
      .max(LARGO_MAXIMO_CONTRASENA, `No puede pasar de ${LARGO_MAXIMO_CONTRASENA} caracteres`),
  })
  .refine((datos) => datos.contrasenaNueva !== datos.contrasenaActual, {
    path: ["contrasenaNueva"],
    message: "La contraseña nueva debe ser distinta de la actual",
  });

export type InicioSesion = z.infer<typeof esquemaInicioSesion>;
export type CambioContrasena = z.infer<typeof esquemaCambioContrasena>;
