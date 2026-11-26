import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Reloj } from "../catalogo/entities/reloj.entity.js";
import { Ciudad } from "../ubicaciones/entities/ciudad.entity.js";
import { EstadoPedido } from "./entities/estado-pedido.entity.js";
import { HistorialEstado } from "./entities/historial-estado.entity.js";
import { NotaPedido } from "./entities/nota-pedido.entity.js";
import { Pedido } from "./entities/pedido.entity.js";
import { PedidosAdminController } from "./pedidos-admin.controller.js";
import { PedidosAdminService } from "./pedidos-admin.service.js";
import { PedidosController } from "./pedidos.controller.js";
import { PedidosService } from "./pedidos.service.js";

/** Pedidos sin registro, su historial de estados y las notas internas. */
@Module({
  imports: [
    // Reloj y Ciudad se consultan dentro de la transacción del pedido, por su administrador de entidades.
    TypeOrmModule.forFeature([Pedido, HistorialEstado, NotaPedido, EstadoPedido, Reloj, Ciudad]),
  ],
  controllers: [PedidosController, PedidosAdminController],
  providers: [PedidosService, PedidosAdminService],
})
export class PedidosModule {}
