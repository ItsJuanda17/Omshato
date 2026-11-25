import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Like, Repository } from "typeorm";

import { compararNombres } from "../../common/text/orden.js";
import { slugificar } from "../../common/text/slug.js";
import type { DatosReloj } from "./catalogo.schemas.js";
import { HistorialPrecio } from "./entities/historial-precio.entity.js";
import { ImagenReloj } from "./entities/imagen-reloj.entity.js";
import { Marca } from "./entities/marca.entity.js";
import { Reloj } from "./entities/reloj.entity.js";
import type { ModoReloj } from "./modo-reloj.js";
import { aRelojDto } from "./reloj.dto.js";

const RELACIONES = { marca: true, imagenes: true } as const;
/** `url_amigable` admite 160; queda margen para el sufijo numérico. */
const LARGO_BASE_URL = 150;

/** Lo que hace el administrador con el catálogo (CU-13 a CU-17). */
@Injectable()
export class CatalogoAdminService {
  constructor(
    @InjectRepository(Reloj) private readonly relojes: Repository<Reloj>,
    @InjectRepository(Marca) private readonly marcas: Repository<Marca>,
  ) {}

  /** Todos los relojes, visibles y ocultos, del más reciente al más antiguo (REQ-ADM-11). */
  async listar() {
    const relojes = await this.relojes.find({
      relations: RELACIONES,
      order: { fechaPublicacion: "DESC", id: "DESC" },
    });
    const pedidos = await this.contarPedidos(relojes.map((reloj) => reloj.id));
    return relojes.map((reloj) => ({
      ...aRelojDto(reloj),
      cantidadPedidos: pedidos.get(reloj.id) ?? 0,
    }));
  }

  async obtener(id: number) {
    const reloj = await this.relojes.findOne({ where: { id }, relations: RELACIONES });
    if (!reloj) {
      throw new NotFoundException("No encontramos ese reloj.");
    }
    const pedidos = await this.contarPedidos([id]);
    return { ...aRelojDto(reloj), cantidadPedidos: pedidos.get(id) ?? 0 };
  }

  /** Todas las marcas, para elegir una existente al crear un reloj (REQ-ADM-12). */
  async listarMarcas() {
    return (await this.marcas.find()).sort(compararNombres);
  }

  /** Agrega un reloj. Si está visible, se publica de inmediato (CU-13). */
  async crear(datos: DatosReloj) {
    const id = await this.relojes.manager.transaction(async (manager) => {
      const marca = await this.resolverMarca(manager, datos);
      const reloj = await manager.save(
        manager.create(Reloj, {
          ...this.columnas(datos),
          idMarca: marca.id,
          urlAmigable: await this.urlUnica(manager, `${marca.nombre} ${datos.nombre}`),
        }),
      );
      await this.guardarImagenes(manager, reloj.id, datos.fotos);
      return reloj.id;
    });
    return this.obtener(id);
  }

  /**
   * Modifica un reloj. Los pedidos ya registrados no cambian porque guardan su propia copia
   * del nombre y el precio (SEF-3). La URL se mantiene estable aunque cambie el nombre.
   * Un cambio de precio queda en el historial con quien lo hizo (SEF-5).
   */
  async actualizar(id: number, datos: DatosReloj, idAdministrador: number) {
    await this.relojes.manager.transaction(async (manager) => {
      const actual = await manager.findOne(Reloj, {
        where: { id },
        relations: { imagenes: true },
        lock: { mode: "pessimistic_write", tables: ["reloj"] },
      });
      if (!actual) {
        throw new NotFoundException("No encontramos ese reloj.");
      }

      const marca = await this.resolverMarca(manager, datos);
      if (actual.precioCop !== datos.precioCop) {
        await manager.insert(HistorialPrecio, {
          idReloj: id,
          idAdministrador,
          precioAnterior: actual.precioCop,
          precioNuevo: datos.precioCop,
        });
      }
      await manager.update(
        Reloj,
        { id },
        { ...this.columnas(datos), idMarca: marca.id, fechaActualizacion: new Date() },
      );

      const igualesALasActuales =
        actual.imagenes.length === datos.fotos.length &&
        actual.imagenes
          .toSorted((a, b) => a.orden - b.orden)
          .every((imagen, posicion) => imagen.archivo === datos.fotos[posicion]);
      if (!igualesALasActuales) {
        await manager.delete(ImagenReloj, { idReloj: id });
        await this.guardarImagenes(manager, id, datos.fotos);
      }
    });
    return this.obtener(id);
  }

  /** Cambia el modo sin abrir el formulario (CU-15, REQ-ADM-6). */
  async cambiarModo(id: number, modo: ModoReloj) {
    const reloj = await this.relojes.findOneBy({ id });
    if (!reloj) {
      throw new NotFoundException("No encontramos ese reloj.");
    }
    // La cantidad solo aplica a Disponible y el plazo solo a Bajo pedido (TBD-2, TBD-7).
    await this.relojes.update(
      { id },
      {
        modo,
        cantidad: modo === "DISPONIBLE" ? (reloj.cantidad ?? 1) : null,
        plazoEstimado: modo === "DISPONIBLE" ? null : reloj.plazoEstimado,
        fechaActualizacion: new Date(),
      },
    );
    return this.obtener(id);
  }

  /** Oculta o muestra un reloj sin borrarlo (CU-16, REQ-ADM-7). */
  async cambiarVisibilidad(id: number, visible: boolean) {
    const { affected } = await this.relojes.update(
      { id },
      { visible, fechaActualizacion: new Date() },
    );
    if (!affected) {
      throw new NotFoundException("No encontramos ese reloj.");
    }
    return this.obtener(id);
  }

  /** Elimina un reloj solo si no tiene pedidos asociados (CU-17, RN-8, REQ-ADM-8). */
  async eliminar(id: number) {
    const conPedidos = () =>
      new ConflictException(
        "Este reloj tiene pedidos asociados y no se puede eliminar. Puedes ocultarlo.",
        { errorCode: "TIENE_PEDIDOS" },
      );

    await this.relojes.manager
      .transaction(async (manager) => {
        if (!(await manager.existsBy(Reloj, { id }))) {
          throw new NotFoundException("No encontramos ese reloj.");
        }
        const [{ tiene }]: { tiene: boolean }[] = await manager.query(
          "SELECT EXISTS (SELECT 1 FROM pedido WHERE id_reloj = $1) AS tiene",
          [id],
        );
        if (tiene) {
          throw conPedidos();
        }
        // El historial de precios no cuenta como pedido: se va con el reloj.
        await manager.delete(HistorialPrecio, { idReloj: id });
        await manager.delete(Reloj, { id });
      })
      .catch((error: unknown) => {
        // Un pedido que entró entre la comprobación y el borrado lo frena la clave foránea.
        if ((error as { driverError?: { code?: string } }).driverError?.code === "23503") {
          throw conPedidos();
        }
        throw error;
      });
  }

  /** Las columnas del reloj que vienen del formulario, sin la marca ni la URL. */
  private columnas(datos: DatosReloj) {
    return {
      nombre: datos.nombre,
      genero: datos.genero,
      precioCop: datos.precioCop,
      cantidad: datos.cantidad,
      garantia: datos.garantia,
      detalleMecanica: datos.detalleMecanica,
      descripcion: datos.descripcion,
      modo: datos.modo,
      visible: datos.visible,
      plazoEstimado: datos.plazoEstimado,
    };
  }

  /** Una marca existente por id, o por nombre sin distinguir mayúsculas; si no hay, se crea (REQ-ADM-12). */
  private async resolverMarca(manager: EntityManager, datos: DatosReloj) {
    if (datos.idMarca !== null) {
      const marca = await manager.findOneBy(Marca, { id: datos.idMarca });
      if (!marca) {
        throw new UnprocessableEntityException("La marca elegida no existe.", {
          errorCode: "MARCA_NO_EXISTE",
        });
      }
      return marca;
    }

    const nombre = datos.marcaNueva as string;
    const existente = await manager
      .createQueryBuilder(Marca, "marca")
      .where("lower(marca.nombre) = lower(:nombre)", { nombre })
      .getOne();
    return existente ?? manager.save(manager.create(Marca, { nombre }));
  }

  /** Una URL propia y estable (REQ-CAT-7). Si el nombre ya existe, agrega un número. */
  private async urlUnica(manager: EntityManager, texto: string) {
    const base = slugificar(texto).slice(0, LARGO_BASE_URL).replace(/-+$/, "") || "reloj";
    const ocupadas = new Set(
      (
        await manager.find(Reloj, {
          select: { urlAmigable: true },
          where: [{ urlAmigable: base }, { urlAmigable: Like(`${base}-%`) }],
        })
      ).map((reloj) => reloj.urlAmigable),
    );
    let candidata = base;
    for (let n = 2; ocupadas.has(candidata); n += 1) {
      candidata = `${base}-${n}`;
    }
    return candidata;
  }

  /** La primera foto es la principal (REQ-ADM-10). */
  private async guardarImagenes(manager: EntityManager, idReloj: number, fotos: string[]) {
    await manager.insert(
      ImagenReloj,
      fotos.map((archivo, posicion) => ({
        idReloj,
        archivo,
        orden: posicion + 1,
        esPrincipal: posicion === 0,
      })),
    );
  }

  /** Cuántos pedidos tiene cada reloj: decide si el panel deja eliminarlo (RN-8). */
  private async contarPedidos(ids: number[]) {
    if (ids.length === 0) {
      return new Map<number, number>();
    }
    const filas: { id: number; total: number }[] = await this.relojes.manager.query(
      `SELECT id_reloj AS id, count(*)::int AS total
         FROM pedido WHERE id_reloj = ANY($1::int[]) GROUP BY id_reloj`,
      [ids],
    );
    return new Map(filas.map((fila) => [fila.id, fila.total]));
  }
}
