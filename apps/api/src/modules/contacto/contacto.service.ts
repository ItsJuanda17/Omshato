import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type { DatosEnlaces } from "./contacto.schemas.js";
import { EnlaceContacto } from "./entities/enlace-contacto.entity.js";
import { resolverContacto } from "./resolver-contacto.js";
import { TIPOS_ENLACE, type TipoEnlace } from "./tipo-enlace.js";

const CLAVE_POR_TIPO = {
  WHATSAPP: "whatsapp",
  INSTAGRAM: "instagram",
  TIKTOK: "tiktok",
} as const satisfies Record<TipoEnlace, keyof DatosEnlaces>;

@Injectable()
export class ContactoService {
  constructor(
    @InjectRepository(EnlaceContacto) private readonly enlaces: Repository<EnlaceContacto>,
  ) {}

  /** Lo que muestra el sitio público: solo los enlaces configurados y activos (REQ-CON-4). */
  async obtenerPublico() {
    return resolverContacto(await this.enlaces.find());
  }

  /** Los tres enlaces tal como se editan en el panel, siempre en el mismo orden. */
  async listar() {
    const enlaces = await this.enlaces.find();
    return enlaces.toSorted((a, b) => TIPOS_ENLACE.indexOf(a.tipo) - TIPOS_ENLACE.indexOf(b.tipo));
  }

  /** Guarda los tres enlaces a la vez (CU-25). */
  async actualizar(datos: DatosEnlaces) {
    await this.enlaces.manager.transaction(async (manager) => {
      for (const tipo of TIPOS_ENLACE) {
        const { valor, activo } = datos[CLAVE_POR_TIPO[tipo]];
        await manager.upsert(EnlaceContacto, { tipo, valor, activo }, ["tipo"]);
      }
    });
    return this.listar();
  }
}
