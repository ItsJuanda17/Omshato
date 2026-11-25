import { CurrentUser, Public, SignInService } from "@nestjs/authentication";
import { Body, Controller, Get, HttpCode, Post } from "@nestjs/common";

import type { AdministradorActual } from "./administrador-actual.js";
import {
  type CambioContrasena,
  esquemaCambioContrasena,
  esquemaInicioSesion,
  type InicioSesion,
} from "./auth.schemas.js";
import { AuthService } from "./auth.service.js";

/**
 * Sesión del administrador (CU-10, CU-11, CU-12). Todas las rutas exigen sesión
 * (REQ-AUT-1) salvo el inicio de sesión, que es la que la crea.
 */
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly inicioSesion: SignInService,
  ) {}

  /** Crea la sesión y la deja en una cookie `HttpOnly`: el front nunca ve el token. */
  @Public()
  @Post("login")
  @HttpCode(200)
  async iniciarSesion(@Body({ schema: esquemaInicioSesion }) datos: InicioSesion) {
    const administrador = await this.auth.verificarCredenciales(datos.correo, datos.contrasena);
    await this.inicioSesion.signIn(String(administrador.id), { method: "password" });
    return { administrador };
  }

  @Post("logout")
  @HttpCode(204)
  async cerrarSesion() {
    await this.inicioSesion.signOut();
  }

  /** Quién tiene la sesión: el front lo usa para saber si debe mandar al inicio de sesión. */
  @Get("yo")
  yo(@CurrentUser() administrador: AdministradorActual) {
    return { administrador };
  }

  @Post("cambiar-contrasena")
  @HttpCode(204)
  async cambiarContrasena(
    @CurrentUser() administrador: AdministradorActual,
    @Body({ schema: esquemaCambioContrasena }) datos: CambioContrasena,
  ) {
    await this.auth.cambiarContrasena(administrador, datos.contrasenaActual, datos.contrasenaNueva);
  }
}
