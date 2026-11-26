import { CurrentUser } from "@nestjs/authentication";
import {
  type CambioEstado,
  esquemaCambioEstado,
  esquemaNota,
  type NuevaNota,
} from "@omshato/contratos";
import { Body, Controller, Get, Param, Post } from "@nestjs/common";

import type { AdministradorActual } from "../auth/administrador-actual.js";
import { esquemaId } from "../catalogo/catalogo.schemas.js";
import { PedidosAdminService } from "./pedidos-admin.service.js";

/** Gestión de pedidos. Toda ruta exige sesión (REQ-AUT-1): es el valor por defecto del guard. */
@Controller("admin/pedidos")
export class PedidosAdminController {
  constructor(private readonly pedidos: PedidosAdminService) {}

  @Get()
  listar() {
    return this.pedidos.listar();
  }

  @Get(":id")
  obtener(@Param("id", { schema: esquemaId }) id: number) {
    return this.pedidos.obtener(id);
  }

  @Post(":id/estado")
  cambiarEstado(
    @Param("id", { schema: esquemaId }) id: number,
    @Body({ schema: esquemaCambioEstado }) cambio: CambioEstado,
    @CurrentUser() administrador: AdministradorActual,
  ) {
    return this.pedidos.cambiarEstado(id, cambio, administrador.id);
  }

  @Post(":id/notas")
  agregarNota(
    @Param("id", { schema: esquemaId }) id: number,
    @Body({ schema: esquemaNota }) nota: NuevaNota,
    @CurrentUser() administrador: AdministradorActual,
  ) {
    return this.pedidos.agregarNota(id, nota.texto, administrador.id);
  }
}
