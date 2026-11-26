import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Ciudad } from "./entities/ciudad.entity.js";
import { Departamento } from "./entities/departamento.entity.js";
import { UbicacionesController } from "./ubicaciones.controller.js";
import { UbicacionesService } from "./ubicaciones.service.js";

/** Departamentos y ciudades de Colombia (DIVIPOLA). */
@Module({
  imports: [TypeOrmModule.forFeature([Departamento, Ciudad])],
  controllers: [UbicacionesController],
  providers: [UbicacionesService],
  exports: [UbicacionesService],
})
export class UbicacionesModule {}
