import { z } from "zod";

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
});

export type Env = z.infer<typeof esquemaEnv>;
