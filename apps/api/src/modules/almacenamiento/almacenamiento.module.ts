import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { LocalDisk, StorageModule } from "@nestjs/storage";
import { TypeOrmModule } from "@nestjs/typeorm";
import { resolve } from "node:path";

import type { Env } from "../../config/env.schema.js";
import { ImagenReloj } from "../catalogo/entities/imagen-reloj.entity.js";
import { FotosController } from "./fotos.controller.js";
import { FotosService } from "./fotos.service.js";

/**
 * Fotos de los relojes, en una carpeta local. Se eligió así para no pagar un servicio
 * en la nube todavía: cuando haga falta, se cambia `LocalDisk` por `S3Disk` aquí y nada
 * más del API se entera.
 */
@Module({
  imports: [
    StorageModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        default: "fotos",
        disks: {
          fotos: new LocalDisk({
            root: resolve(config.get("ALMACENAMIENTO_RUTA", { infer: true })),
          }),
        },
      }),
    }),
    TypeOrmModule.forFeature([ImagenReloj]),
  ],
  controllers: [FotosController],
  providers: [FotosService],
  exports: [FotosService],
})
export class AlmacenamientoModule {}
