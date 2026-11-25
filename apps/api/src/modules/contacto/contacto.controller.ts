import { Public } from "@nestjs/authentication";
import { Body, Controller, Get, Put } from "@nestjs/common";

import { type DatosEnlaces, esquemaEnlaces } from "./contacto.schemas.js";
import { ContactoService } from "./contacto.service.js";

@Controller()
export class ContactoController {
  constructor(private readonly contacto: ContactoService) {}

  /** Los íconos de contacto del sitio. No pide sesión. */
  @Public()
  @Get("contacto")
  publico() {
    return this.contacto.obtenerPublico();
  }

  @Get("admin/contacto")
  listar() {
    return this.contacto.listar();
  }

  @Put("admin/contacto")
  actualizar(@Body({ schema: esquemaEnlaces }) datos: DatosEnlaces) {
    return this.contacto.actualizar(datos);
  }
}
