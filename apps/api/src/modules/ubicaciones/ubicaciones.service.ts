import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { compararNombres } from "../../common/text/orden.js";
import { Ciudad } from "./entities/ciudad.entity.js";
import { Departamento } from "./entities/departamento.entity.js";

@Injectable()
export class UbicacionesService {
  constructor(
    @InjectRepository(Departamento) private readonly departamentos: Repository<Departamento>,
    @InjectRepository(Ciudad) private readonly ciudades: Repository<Ciudad>,
  ) {}

  /** Los 33 departamentos, en orden alfabético (REQ-PED-5). */
  async listarDepartamentos() {
    return (await this.departamentos.find()).sort(compararNombres);
  }

  /** Todas las ciudades, o las de un departamento, en orden alfabético. */
  async listarCiudades(idDepartamento?: number) {
    const ciudades = await this.ciudades.find({
      where: idDepartamento === undefined ? {} : { idDepartamento },
    });
    return ciudades.sort(compararNombres);
  }
}
