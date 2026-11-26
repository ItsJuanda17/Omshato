import { AuthenticationModule } from "@nestjs/authentication";
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import type { Env } from "../../config/env.schema.js";
import { AlmacenSesiones } from "./almacen-sesiones.js";
import { AuthController } from "./auth.controller.js";
import { AuthService } from "./auth.service.js";
import { Administrador } from "./entities/administrador.entity.js";
import { Sesion } from "./entities/sesion.entity.js";
import { SesionAdministrador } from "./sesion-administrador.js";

/**
 * Inicio de sesión, sesión del administrador, bloqueo por intentos y cambio de
 * contraseña. `AuthenticationModule` registra un guard global: toda ruta exige
 * sesión salvo las que llevan `@Public()`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Administrador, Sesion]),
    AuthenticationModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        session: {
          idleTtl: config.get("SESION_INACTIVIDAD", { infer: true }),
          absoluteTtl: config.get("SESION_DURACION_MAXIMA", { infer: true }),
          // El front vive en otro origen: sus peticiones de escritura son válidas solo desde él.
          trustedOrigins: [config.get("CORS_ORIGIN", { infer: true })],
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AlmacenSesiones, SesionAdministrador],
})
export class AuthModule {}
