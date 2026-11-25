import { Public } from "@nestjs/authentication";
import { Controller, Get, Param } from "@nestjs/common";
import { z } from "zod";

import { CatalogoService } from "./catalogo.service.js";

const esquemaUrl = z.string().regex(/^[a-z0-9-]{1,160}$/);

/** El catálogo que ve el comprador. No pide sesión. */
@Public()
@Controller()
export class CatalogoController {
  constructor(private readonly catalogo: CatalogoService) {}

  @Get("relojes")
  listar() {
    return this.catalogo.listar();
  }

  @Get("relojes/:urlAmigable")
  obtener(@Param("urlAmigable", { schema: esquemaUrl }) urlAmigable: string) {
    return this.catalogo.obtener(urlAmigable);
  }

  @Get("marcas")
  marcas() {
    return this.catalogo.listarMarcas();
  }
}
