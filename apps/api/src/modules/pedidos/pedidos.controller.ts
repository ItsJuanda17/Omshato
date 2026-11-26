import { Public } from "@nestjs/authentication";
import { Body, Controller, Post, Res } from "@nestjs/common";
import type { Response } from "express";

import { LimitarSolicitudes } from "../../common/decorators/limitar-solicitudes.decorator.js";
import { type NuevoPedido, esquemaNuevoPedido } from "./pedidos.schemas.js";
import { PedidosService } from "./pedidos.service.js";

/** El pedido sin registro del comprador (CU-04). */
@Public()
@Controller("pedidos")
export class PedidosController {
  constructor(private readonly pedidos: PedidosService) {}

  /** 201 con el pedido nuevo; 200 si es el mismo envío repetido (REQ-PED-12). */
  @Post()
  @LimitarSolicitudes(10, 10)
  async crear(
    @Body({ schema: esquemaNuevoPedido }) datos: NuevoPedido,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { pedido, creado } = await this.pedidos.crear(datos);
    res.status(creado ? 201 : 200);
    return pedido;
  }
}
