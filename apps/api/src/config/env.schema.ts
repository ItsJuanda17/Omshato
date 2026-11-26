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

  // Dónde se guardan las fotos de los relojes. Por ahora, una carpeta local (sin costo de nube).
  ALMACENAMIENTO_RUTA: z.string().min(1).default("./storage"),

  // Límite de solicitudes por IP en inicio de sesión y pedidos (SEI-8). Solo se apaga en pruebas.
  LIMITE_SOLICITUDES: z
    .enum(["activo", "apagado"])
    .default("activo")
    .transform((valor) => valor === "activo"),
  // Cuántos proxies hay delante del API (0 = ninguno). Sin esto, detrás de un proxy todos los
  // visitantes compartirían la IP del proxy y el límite de solicitudes los contaría juntos.
  PROXIES_DE_CONFIANZA: z.coerce.number().int().min(0).default(0),
});

export type Env = z.infer<typeof esquemaEnv>;
