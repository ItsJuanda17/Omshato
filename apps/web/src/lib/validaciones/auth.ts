import { z } from "zod";

export const esquemaInicioSesion = z.object({
  correo: z.string().trim().min(1, "Escribe tu correo.").email("Escribe un correo válido."),
  contrasena: z.string().min(1, "Escribe tu contraseña."),
});

export type DatosInicioSesion = z.infer<typeof esquemaInicioSesion>;
