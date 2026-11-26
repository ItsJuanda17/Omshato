import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { HistorialEstado } from "./entities/historial-estado.entity.js";
import { NotaPedido } from "./entities/nota-pedido.entity.js";
import { Pedido } from "./entities/pedido.entity.js";
import { codigoDeEstado, ESTADOS_PEDIDO, idDeEstado, puedeCambiar } from "./estados-pedido.js";
import { aPedidoAdminDto, RELACIONES_PEDIDO } from "./pedido.dto.js";
import type { CambioEstado } from "./pedidos.schemas.js";

const NOMBRE_ESTADO = new Map<string, string>(ESTADOS_PEDIDO.map((e) => [e.codigo, e.nombre]));

/** La gestión de pedidos del administrador (CU-18 a CU-22). */
@Injectable()
export class PedidosAdminService {
  constructor(@InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>) {}

  /** Todos los pedidos, del más reciente al más antiguo (REQ-GPE-1). */
  async listar() {
    const pedidos = await this.pedidos.find({
      relations: RELACIONES_PEDIDO,
      order: { fechaCreacion: "DESC", id: "DESC" },
    });
    return pedidos.map(aPedidoAdminDto);
  }

  /** El detalle con su historial y sus notas (REQ-GPE-3). */
  async obtener(id: number) {
    const pedido = await this.pedidos.findOne({ where: { id }, relations: RELACIONES_PEDIDO });
    if (!pedido) {
      throw new NotFoundException("No encontramos ese pedido.");
    }
    return aPedidoAdminDto(pedido);
  }

  /**
   * Cambia el estado. Solo permite las transiciones de la Tabla 2 del SRS (REQ-GPE-5) y
   * registra quién y cuándo lo hizo (REQ-GPE-7). Bloquea la fila mientras decide: si dos
   * cambios llegan a la vez, el segundo ve el estado que dejó el primero.
   */
  async cambiarEstado(id: number, cambio: CambioEstado, idAdministrador: number) {
    await this.pedidos.manager.transaction(async (manager) => {
      const pedido = await manager.findOne(Pedido, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!pedido) {
        throw new NotFoundException("No encontramos ese pedido.");
      }

      const desde = codigoDeEstado(pedido.idEstado);
      if (!puedeCambiar(desde, cambio.estado)) {
        throw new ConflictException(
          `Un pedido en estado «${NOMBRE_ESTADO.get(desde)}» no puede pasar a «${NOMBRE_ESTADO.get(cambio.estado)}».`,
          { errorCode: "TRANSICION_NO_PERMITIDA" },
        );
      }

      const idEstado = idDeEstado(cambio.estado);
      await manager.update(
        Pedido,
        { id },
        { idEstado, ...(cambio.estado === "CANCELADO" && { motivoCancelacion: cambio.motivo }) },
      );
      await manager.insert(HistorialEstado, { idPedido: id, idEstado, idAdministrador });
    });
    return this.obtener(id);
  }

  /** Agrega una nota interna (REQ-GPE-11). */
  async agregarNota(id: number, texto: string, idAdministrador: number) {
    if (!(await this.pedidos.existsBy({ id }))) {
      throw new NotFoundException("No encontramos ese pedido.");
    }
    await this.pedidos.manager.insert(NotaPedido, { idPedido: id, idAdministrador, texto });
    return this.obtener(id);
  }
}
