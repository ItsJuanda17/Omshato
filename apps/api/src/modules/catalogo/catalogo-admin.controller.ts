import { CurrentUser } from "@nestjs/authentication";
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from "@nestjs/common";

import type { AdministradorActual } from "../auth/administrador-actual.js";
import { CatalogoAdminService } from "./catalogo-admin.service.js";
import {
  type DatosReloj,
  esquemaCambioModo,
  esquemaCambioVisibilidad,
  esquemaDatosReloj,
  esquemaId,
} from "./catalogo.schemas.js";
import type { ModoReloj } from "./modo-reloj.js";

/** Gestión del catálogo. Toda ruta exige sesión (REQ-AUT-1): es el valor por defecto del guard. */
@Controller("admin")
export class CatalogoAdminController {
  constructor(private readonly catalogo: CatalogoAdminService) {}

  @Get("relojes")
  listar() {
    return this.catalogo.listar();
  }

  @Get("relojes/:id")
  obtener(@Param("id", { schema: esquemaId }) id: number) {
    return this.catalogo.obtener(id);
  }

  @Post("relojes")
  crear(@Body({ schema: esquemaDatosReloj }) datos: DatosReloj) {
    return this.catalogo.crear(datos);
  }

  @Put("relojes/:id")
  actualizar(
    @Param("id", { schema: esquemaId }) id: number,
    @Body({ schema: esquemaDatosReloj }) datos: DatosReloj,
    @CurrentUser() administrador: AdministradorActual,
  ) {
    return this.catalogo.actualizar(id, datos, administrador.id);
  }

  @Patch("relojes/:id/modo")
  cambiarModo(
    @Param("id", { schema: esquemaId }) id: number,
    @Body({ schema: esquemaCambioModo }) cuerpo: { modo: ModoReloj },
  ) {
    return this.catalogo.cambiarModo(id, cuerpo.modo);
  }

  @Patch("relojes/:id/visibilidad")
  cambiarVisibilidad(
    @Param("id", { schema: esquemaId }) id: number,
    @Body({ schema: esquemaCambioVisibilidad }) cuerpo: { visible: boolean },
  ) {
    return this.catalogo.cambiarVisibilidad(id, cuerpo.visible);
  }

  @Delete("relojes/:id")
  @HttpCode(204)
  eliminar(@Param("id", { schema: esquemaId }) id: number) {
    return this.catalogo.eliminar(id);
  }

  @Get("marcas")
  marcas() {
    return this.catalogo.listarMarcas();
  }
}
