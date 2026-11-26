import { estadoInicial, type NuevoPedido } from "@omshato/contratos";
import { ConflictException, Injectable, UnprocessableEntityException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Reloj } from "../catalogo/entities/reloj.entity.js";
import { Ciudad } from "../ubicaciones/entities/ciudad.entity.js";
import { HistorialEstado } from "./entities/historial-estado.entity.js";
import { Pedido } from "./entities/pedido.entity.js";
import { idDeEstado } from "./estados-pedido.js";
import { aPedidoDto, RELACIONES_PEDIDO } from "./pedido.dto.js";

const UNIQUE_VIOLATION = "23505";

/** El pedido sin registro que hace el comprador (CU-04). */
@Injectable()
export class PedidosService {
  constructor(@InjectRepository(Pedido) private readonly pedidos: Repository<Pedido>) {}

  /**
   * Registra un pedido (REQ-PED-1). Un pedido lleva un solo reloj. El estado inicial depende
   * del modo del reloj (REQ-PED-9) y el pedido guarda el nombre y el precio vigentes
   * (REQ-PED-10). Si la clave de idempotencia ya se usó, devuelve el pedido que ya se
   * registró en vez de crear otro (REQ-PED-12): `creado` dice cuál de los dos casos fue.
   */
  async crear(datos: NuevoPedido) {
    const previo = await this.buscarPorClave(datos.claveIdempotencia);
    if (previo) {
      return { pedido: previo, creado: false };
    }

    try {
      const id = await this.pedidos.manager.transaction((manager) => this.insertar(manager, datos));
      return { pedido: await this.cargar(id), creado: true };
    } catch (error) {
      // Dos envíos idénticos a la vez: gana uno y el otro recibe ese mismo pedido.
      if ((error as { driverError?: { code?: string } }).driverError?.code === UNIQUE_VIOLATION) {
        const ganador = await this.buscarPorClave(datos.claveIdempotencia);
        if (ganador) {
          return { pedido: ganador, creado: false };
        }
      }
      throw error;
    }
  }

  private async insertar(manager: Repository<Pedido>["manager"], datos: NuevoPedido) {
    // REQ-PED-11: un reloj oculto o retirado no se puede pedir. Uno que no existe, igual.
    const reloj = await manager.findOne(Reloj, {
      where: { id: datos.idReloj, visible: true },
      relations: { marca: true },
    });
    if (!reloj) {
      throw new ConflictException(
        "Este reloj ya no está disponible en el catálogo, así que no pudimos registrar tu pedido.",
        { errorCode: "RELOJ_NO_DISPONIBLE" },
      );
    }
    if (!(await manager.existsBy(Ciudad, { id: datos.idCiudad }))) {
      throw new UnprocessableEntityException("Elige una ciudad de la lista.", {
        errorCode: "CIUDAD_NO_EXISTE",
      });
    }

    const ahora = new Date();
    const [{ numero }]: { numero: number }[] = await manager.query(
      "SELECT nextval('numero_pedido_seq')::int AS numero",
    );
    const idEstado = idDeEstado(estadoInicial(reloj.modo));

    const pedido = await manager.save(
      manager.create(Pedido, {
        numeroPedido: `OMS-${String(numero).padStart(4, "0")}`,
        idReloj: reloj.id,
        idEstado,
        idCiudad: datos.idCiudad,
        nombreReloj: `${reloj.marca.nombre} ${reloj.nombre}`,
        precioReloj: reloj.precioCop,
        modoReloj: reloj.modo,
        nombreComprador: datos.nombreComprador,
        telefonoComprador: datos.telefonoComprador,
        direccion: datos.direccion,
        // La hora la pone el servidor: es la evidencia de la autorización (Ley 1581, REQ-PED-6).
        fechaAutorizacionDatos: ahora,
        claveIdempotencia: datos.claveIdempotencia,
        fechaCreacion: ahora,
      }),
    );
    await manager.insert(HistorialEstado, {
      idPedido: pedido.id,
      idEstado,
      idAdministrador: null,
      fechaHora: ahora,
    });
    return pedido.id;
  }

  private async buscarPorClave(claveIdempotencia: string) {
    const existente = await this.pedidos.findOne({
      select: { id: true },
      where: { claveIdempotencia },
    });
    return existente ? this.cargar(existente.id) : null;
  }

  private async cargar(id: number) {
    const pedido = await this.pedidos.findOneOrFail({
      where: { id },
      relations: RELACIONES_PEDIDO,
    });
    return aPedidoDto(pedido);
  }
}
