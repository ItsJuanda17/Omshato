import { Injectable } from "@nestjs/common";
import {
  AuthenticationStorage,
  type SessionRecord,
  type SessionStore,
} from "@nestjs/authentication";
import { InjectRepository } from "@nestjs/typeorm";
import { LessThanOrEqual, Repository } from "typeorm";

import { Sesion } from "./entities/sesion.entity.js";

function aRegistro(fila: Sesion): SessionRecord {
  return {
    id: fila.id,
    userId: String(fila.idAdministrador),
    createdAt: fila.fechaCreacion,
    expiresAt: fila.fechaExpiracion,
    lastActiveAt: fila.ultimaActividad,
    ...(fila.metadatos ? { metadata: fila.metadatos } : {}),
  };
}

/**
 * Guarda las sesiones en la tabla `sesion`. Así sobreviven a un reinicio del
 * API y varias instancias comparten las mismas (sin esto el paquete se niega a
 * arrancar en producción). Cada método cumple el contrato de `SessionStore`:
 * lo que no existe vuelve como `undefined`, y las escrituras son una sola
 * sentencia para que dos solicitudes simultáneas no se pisen.
 */
@Injectable()
export class AlmacenSesiones implements SessionStore {
  constructor(
    @InjectRepository(Sesion) private readonly sesiones: Repository<Sesion>,
    almacenamiento: AuthenticationStorage,
  ) {
    almacenamiento.registerSource({ sessions: this });
  }

  async getSession(id: string) {
    const fila = await this.sesiones.findOneBy({ id });
    return fila ? aRegistro(fila) : undefined;
  }

  async createSession(registro: SessionRecord) {
    // Aprovecha cada inicio de sesión para que la tabla no crezca con sesiones vencidas.
    await this.sesiones.delete({ fechaExpiracion: LessThanOrEqual(new Date()) });
    await this.sesiones.insert({
      id: registro.id,
      idAdministrador: Number(registro.userId),
      fechaCreacion: registro.createdAt,
      fechaExpiracion: registro.expiresAt,
      ultimaActividad: registro.lastActiveAt,
      // TypeORM tipa mal los jsonb en `insert` (los trata como una entidad parcial).
      metadatos: (registro.metadata ?? null) as Record<string, never> | null,
    });
  }

  async touchSession(id: string, ultimaActividad: Date) {
    // Solo hacia adelante y solo si la sesión sigue existiendo: una solicitud lenta
    // no puede revivir una sesión que otra ya cerró.
    await this.sesiones
      .createQueryBuilder()
      .update()
      .set({ ultimaActividad })
      .where("id_sesion = :id AND ultima_actividad < :ultimaActividad", { id, ultimaActividad })
      .execute();
  }

  async deleteSession(id: string) {
    const { affected } = await this.sesiones.delete({ id });
    return (affected ?? 0) > 0;
  }

  async listUserSessions(userId: string) {
    const filas = await this.sesiones.findBy({ idAdministrador: Number(userId) });
    return filas.map(aRegistro);
  }

  async deleteUserSessions(userId: string) {
    await this.sesiones.delete({ idAdministrador: Number(userId) });
  }
}
