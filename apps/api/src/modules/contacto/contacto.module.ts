import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { ContactoController } from "./contacto.controller.js";
import { ContactoService } from "./contacto.service.js";
import { EnlaceContacto } from "./entities/enlace-contacto.entity.js";

/** Enlaces de WhatsApp, Instagram y TikTok. */
@Module({
  imports: [TypeOrmModule.forFeature([EnlaceContacto])],
  controllers: [ContactoController],
  providers: [ContactoService],
  exports: [ContactoService],
})
export class ContactoModule {}
