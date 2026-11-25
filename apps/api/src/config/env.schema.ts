import { z } from "zod";

/** Duración como la entiende @nestjs/authentication: "30m", "12h", "7d". */
const duracion = z
  .string()
  .regex(/^[1-9]\d*[smhd]$/, "Usa un número y una unidad: 30m, 12h, 7d")
  .transform((valor) => valor as `${number}${"s" | "m" | "h" | "d"}`);

/**
 * Variables de entorno del API. Se validan al arrancar: si falta una o es
 * inválida, el API no inicia y dice cuáles fallaron. Las variables de cada
 * módulo se agregan aquí cuando el módulo las necesita.
 */
export const esquemaEnv = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  CORS_ORIGIN: z.url().default("http://localhost:3000"),

  // Autenticación (REQ-AUT-*). Los valores por defecto son de referencia hasta cerrar TBD-17.
  AUTH_MAX_INTENTOS: z.coerce.number().int().min(1).default(5),
  AUTH_BLOQUEO_MINUTOS: z.coerce.number().int().min(1).default(15),
  SESION_INACTIVIDAD: duracion.default("30m"),
  SESION_DURACION_MAXIMA: duracion.default("12h"),
});

export type Env = z.infer<typeof esquemaEnv>;
