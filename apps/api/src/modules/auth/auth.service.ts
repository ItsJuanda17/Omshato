import { PasswordHasher, SessionService, SignInService } from "@nestjs/authentication";
import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import type { Env } from "../../config/env.schema.js";
import type { AdministradorActual } from "./administrador-actual.js";
import { Administrador } from "./entities/administrador.entity.js";

const MS_POR_MINUTO = 60_000;

/** Lo que el front puede ver de una cuenta: nunca el hash ni el estado del bloqueo. */
function publico({ id, nombre, correo }: Administrador): AdministradorActual {
  return { id, nombre, correo };
}

/** Normaliza el correo para que `Admin@Omshato.com ` y `admin@omshato.com` sean la misma cuenta. */
export function normalizarCorreo(correo: string) {
  return correo.trim().toLowerCase();
}

@Injectable()
export class AuthService {
  private readonly maxIntentos: number;
  private readonly minutosBloqueo: number;

  constructor(
    @InjectRepository(Administrador) private readonly administradores: Repository<Administrador>,
    private readonly hasher: PasswordHasher,
    private readonly sesiones: SessionService,
    private readonly inicioSesion: SignInService,
    config: ConfigService<Env, true>,
  ) {
    this.maxIntentos = config.get("AUTH_MAX_INTENTOS", { infer: true });
    this.minutosBloqueo = config.get("AUTH_BLOQUEO_MINUTOS", { infer: true });
  }

  /**
   * Comprueba correo y contraseña. Un correo desconocido y una contraseña
   * equivocada dan la misma respuesta y tardan lo mismo (REQ-AUT-3). Tras
   * `AUTH_MAX_INTENTOS` fallos seguidos la cuenta se bloquea `AUTH_BLOQUEO_MINUTOS` (REQ-AUT-4).
   */
  async verificarCredenciales(correo: string, contrasena: string) {
    const administrador = await this.administradores.findOneBy({
      correo: normalizarCorreo(correo),
    });

    if (administrador) {
      this.rechazarSiEstaBloqueada(administrador);
    }

    // Con una cuenta inexistente `verify` compara contra un hash de relleno: tarda lo mismo.
    const esValida = await this.hasher.verify(contrasena, administrador?.contrasenaHash);
    if (!administrador || !esValida) {
      if (administrador) {
        await this.registrarFallo(administrador.id);
      }
      throw new UnauthorizedException("Correo o contraseña incorrectos.", {
        errorCode: "CREDENCIALES_INVALIDAS",
      });
    }

    await this.registrarAcierto(administrador, contrasena);
    return publico(administrador);
  }

  /**
   * Cambia la contraseña (CU-12). Exige la actual, y como cambia el nivel de acceso
   * cierra las demás sesiones y le da una sesión nueva a la actual.
   */
  async cambiarContrasena(actual: AdministradorActual, contrasenaActual: string, nueva: string) {
    const administrador = await this.administradores.findOneByOrFail({ id: actual.id });
    this.rechazarSiEstaBloqueada(administrador);

    if (!(await this.hasher.verify(contrasenaActual, administrador.contrasenaHash))) {
      // También cuenta como intento: sin esto, una sesión robada serviría para adivinar la clave.
      await this.registrarFallo(administrador.id);
      throw new UnprocessableEntityException("La contraseña actual no es correcta.", {
        errorCode: "CONTRASENA_ACTUAL_INCORRECTA",
      });
    }

    await this.administradores.update(
      { id: administrador.id },
      {
        contrasenaHash: await this.hasher.hash(nueva),
        intentosFallidos: 0,
        bloqueadoHasta: null,
      },
    );

    const sesionNueva = await this.inicioSesion.rotateSession();
    await this.sesiones.revokeAll(String(administrador.id), { except: sesionNueva?.session.id });
  }

  private rechazarSiEstaBloqueada({ bloqueadoHasta }: Administrador) {
    const ahora = Date.now();
    if (bloqueadoHasta && bloqueadoHasta.getTime() > ahora) {
      const minutos = Math.ceil((bloqueadoHasta.getTime() - ahora) / MS_POR_MINUTO);
      throw new HttpException(
        {
          message: `Demasiados intentos fallidos. Inténtalo de nuevo en ${minutos} ${minutos === 1 ? "minuto" : "minutos"}.`,
          errorCode: "CUENTA_BLOQUEADA",
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Suma un intento fallido. Bloquea la fila mientras cuenta para que cinco intentos
   * simultáneos no se cuenten como uno solo. Si el bloqueo anterior ya venció, el conteo
   * empieza de cero: de lo contrario el primer fallo después de esperar bloquearía otra vez.
   */
  private async registrarFallo(idAdministrador: number) {
    await this.administradores.manager.transaction(async (manager) => {
      const administrador = await manager.findOne(Administrador, {
        where: { id: idAdministrador },
        lock: { mode: "pessimistic_write" },
      });
      if (!administrador) {
        return;
      }

      const ahora = Date.now();
      const bloqueo = administrador.bloqueadoHasta?.getTime();
      if (bloqueo !== undefined && bloqueo > ahora) {
        return; // Ya está bloqueada: otra solicitud llegó primero.
      }

      const intentos = (bloqueo === undefined ? administrador.intentosFallidos : 0) + 1;
      await manager.update(
        Administrador,
        { id: idAdministrador },
        {
          intentosFallidos: intentos,
          bloqueadoHasta:
            intentos >= this.maxIntentos
              ? new Date(ahora + this.minutosBloqueo * MS_POR_MINUTO)
              : null,
        },
      );
    });
  }

  /** Reinicia el conteo y, si el hash se hizo con parámetros más débiles que los actuales, lo renueva. */
  private async registrarAcierto(administrador: Administrador, contrasena: string) {
    const cambios: Partial<Administrador> = {};
    if (administrador.intentosFallidos > 0 || administrador.bloqueadoHasta) {
      cambios.intentosFallidos = 0;
      cambios.bloqueadoHasta = null;
    }
    if (this.hasher.needsRehash(administrador.contrasenaHash)) {
      cambios.contrasenaHash = await this.hasher.hash(contrasena);
    }
    if (Object.keys(cambios).length > 0) {
      await this.administradores.update({ id: administrador.id }, cambios);
    }
  }
}
