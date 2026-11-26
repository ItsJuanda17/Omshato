import { Public } from "@nestjs/authentication";
import { Controller, Get, Query } from "@nestjs/common";
import { z } from "zod";

import { UbicacionesService } from "./ubicaciones.service.js";

const esquemaCiudades = z.object({
  idDepartamento: z.coerce.number().int().positive().optional(),
});

/** Listas para el formulario de pedido. Son públicas: el comprador no tiene cuenta. */
@Public()
@Controller("ubicaciones")
export class UbicacionesController {
  constructor(private readonly ubicaciones: UbicacionesService) {}

  @Get("departamentos")
  departamentos() {
    return this.ubicaciones.listarDepartamentos();
  }

  /** `?idDepartamento=5` filtra; sin él devuelve las 1.122 ciudades. */
  @Get("ciudades")
  ciudades(@Query({ schema: esquemaCiudades }) consulta: z.infer<typeof esquemaCiudades>) {
    return this.ubicaciones.listarCiudades(consulta.idDepartamento);
  }
}
