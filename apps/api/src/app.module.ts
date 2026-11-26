import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";

import { AppController } from "./app.controller.js";
import { FiltroExcepciones } from "./common/filters/excepciones.filter.js";
import type { Env } from "./config/env.schema.js";
import { ConfiguracionModule } from "./config/configuracion.module.js";
import { DatabaseModule } from "./database/database.module.js";
import { AlmacenamientoModule } from "./modules/almacenamiento/almacenamiento.module.js";
import { AuthModule } from "./modules/auth/auth.module.js";
import { CatalogoModule } from "./modules/catalogo/catalogo.module.js";
import { ContactoModule } from "./modules/contacto/contacto.module.js";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module.js";
import { PedidosModule } from "./modules/pedidos/pedidos.module.js";
import { UbicacionesModule } from "./modules/ubicaciones/ubicaciones.module.js";

@Module({
  imports: [
    ConfiguracionModule,
    // Solo cuenta en las rutas con @LimitarSolicitudes; el tope de aquí es el de respaldo.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        throttlers: [{ name: "default", ttl: 60_000, limit: 60 }],
        skipIf: () => !config.get("LIMITE_SOLICITUDES", { infer: true }),
      }),
    }),
    DatabaseModule,
    AuthModule,
    CatalogoModule,
    PedidosModule,
    UbicacionesModule,
    ContactoModule,
    NotificacionesModule,
    AlmacenamientoModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_FILTER, useClass: FiltroExcepciones }],
})
export class AppModule {}
