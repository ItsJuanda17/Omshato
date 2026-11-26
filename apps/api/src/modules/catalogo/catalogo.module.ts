import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { AlmacenamientoModule } from "../almacenamiento/almacenamiento.module.js";
import { CatalogoAdminController } from "./catalogo-admin.controller.js";
import { CatalogoAdminService } from "./catalogo-admin.service.js";
import { CatalogoController } from "./catalogo.controller.js";
import { CatalogoService } from "./catalogo.service.js";
import { HistorialPrecio } from "./entities/historial-precio.entity.js";
import { ImagenReloj } from "./entities/imagen-reloj.entity.js";
import { Marca } from "./entities/marca.entity.js";
import { Reloj } from "./entities/reloj.entity.js";

/** Relojes, marcas, imágenes e historial de precio. */
@Module({
  imports: [
    TypeOrmModule.forFeature([Reloj, Marca, ImagenReloj, HistorialPrecio]),
    AlmacenamientoModule,
  ],
  controllers: [CatalogoController, CatalogoAdminController],
  providers: [CatalogoService, CatalogoAdminService],
  exports: [CatalogoService],
})
export class CatalogoModule {}
