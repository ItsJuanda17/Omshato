import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { compararNombres } from "../../common/text/orden.js";
import { Marca } from "./entities/marca.entity.js";
import { Reloj } from "./entities/reloj.entity.js";
import { aRelojDto, aResumenDto } from "./reloj.dto.js";

/** Lo que ve el comprador. Un reloj oculto no existe para él (REQ-CAT-1, REQ-DET-6). */
@Injectable()
export class CatalogoService {
  constructor(
    @InjectRepository(Reloj) private readonly relojes: Repository<Reloj>,
    @InjectRepository(Marca) private readonly marcas: Repository<Marca>,
  ) {}

  /** Relojes visibles, del más reciente al más antiguo (REQ-CAT-3). */
  async listar() {
    const relojes = await this.relojes.find({
      where: { visible: true },
      relations: { marca: true, imagenes: true },
      order: { fechaPublicacion: "DESC", id: "DESC" },
    });
    return relojes.map(aResumenDto);
  }

  /** Marcas que tienen al menos un reloj visible, para el filtro (REQ-FIL-2). */
  async listarMarcas() {
    const marcas = await this.marcas
      .createQueryBuilder("marca")
      .where("EXISTS (SELECT 1 FROM reloj r WHERE r.id_marca = marca.id_marca AND r.visible)")
      .getMany();
    return marcas.sort(compararNombres);
  }

  /** Ficha pública. Un reloj que no existe y uno oculto dan la misma respuesta (REQ-DET-6). */
  async obtener(urlAmigable: string) {
    const reloj = await this.relojes.findOne({
      where: { urlAmigable, visible: true },
      relations: { marca: true, imagenes: true },
    });
    if (!reloj) {
      throw new NotFoundException("No encontramos ese reloj.");
    }
    return aRelojDto(reloj);
  }
}
