import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import type { App } from "supertest/types.js";

import { AppModule } from "../../src/app.module.js";
import { configurarApp } from "../../src/configurar-app.js";
import { DatabaseModule } from "../../src/database/database.module.js";
import { BaseDeDatosFalsaModule } from "./base-de-datos-falsa.js";

/** La aplicación completa y con la configuración de producción, pero sin base de datos. */
export async function crearAppSinBaseDeDatos() {
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideModule(DatabaseModule)
    .useModule(BaseDeDatosFalsaModule)
    .compile();

  const app: INestApplication<App> = modulo.createNestApplication();
  configurarApp(app);
  await app.init();
  return app;
}
