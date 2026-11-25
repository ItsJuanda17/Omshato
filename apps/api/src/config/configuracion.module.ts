import { ConfigModule } from "@nestjs/config";

import { esquemaEnv } from "./env.schema.js";

/**
 * Configuración global. Lee `.env.local` y luego `.env`, y valida todo con
 * `esquemaEnv`. Las variables del sistema tienen prioridad sobre los archivos.
 */
export const ConfiguracionModule = ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  envFilePath: [".env.local", ".env"],
  validationSchema: esquemaEnv,
});
