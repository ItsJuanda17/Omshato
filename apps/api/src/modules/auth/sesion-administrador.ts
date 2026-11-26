import {
  AuthenticationRegistry,
  SessionCookieProvider,
  type SessionRecord,
} from "@nestjs/authentication";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type { AdministradorActual } from "./administrador-actual.js";
import { Administrador } from "./entities/administrador.entity.js";

/**
 * Convierte la cookie de sesión en el administrador de la solicitud. Si la
 * cuenta ya no existe devuelve `null` y el paquete cierra esa sesión.
 */
@Injectable()
export class SesionAdministrador extends SessionCookieProvider<AdministradorActual> {
  constructor(
    @InjectRepository(Administrador) private readonly administradores: Repository<Administrador>,
    registro: AuthenticationRegistry,
  ) {
    super();
    registro.registerProvider(this);
  }

  protected async validate(sesion: SessionRecord) {
    const administrador = await this.administradores.findOneBy({ id: Number(sesion.userId) });
    if (!administrador) {
      return null;
    }
    return {
      id: administrador.id,
      nombre: administrador.nombre,
      correo: administrador.correo,
    };
  }
}
