import { LARGO_MAXIMO_CONTRASENA } from "@omshato/contratos";
import { z } from "zod";

// La contraseña nueva y su largo los comparte el front desde `@omshato/contratos`.
export {
  type CambioContrasena,
  esquemaCambioContrasena,
  LARGO_MAXIMO_CONTRASENA,
  LARGO_MINIMO_CONTRASENA,
} from "@omshato/contratos";

export const esquemaInicioSesion = z.object({
  correo: z.string().trim().min(1, "Escribe tu correo").max(254),
  // Sin reglas de formato: una contraseña mal escrita debe fallar como credencial, no como dato.
  contrasena: z.string().min(1, "Escribe tu contraseña").max(LARGO_MAXIMO_CONTRASENA),
});

export type InicioSesion = z.infer<typeof esquemaInicioSesion>;
