import { type INestApplication, StandardSchemaValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";

import type { Env } from "./config/env.schema.js";

/**
 * Ajustes de la aplicación HTTP. Los usan `main.ts` y las pruebas e2e, para que
 * las pruebas corran con la misma configuración que producción.
 */
export function configurarApp(app: INestApplication) {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.setGlobalPrefix("api");
  app.use(helmet());
  // La sesión del administrador viaja en una cookie, así que el CORS admite credenciales.
  app.enableCors({ origin: config.get("CORS_ORIGIN", { infer: true }), credentials: true });
  // Solo valida los parámetros que declaran un `schema`: @Body({ schema }), @Param('id', { schema }).
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  app.enableShutdownHooks();
}
