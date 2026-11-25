/** El administrador con la sesión activa. Nunca incluye el hash ni los intentos fallidos. */
export interface AdministradorActual {
  id: number;
  nombre: string;
  correo: string;
}

// Le dice al paquete de autenticación qué devuelve `@CurrentUser()`.
declare module "@nestjs/authentication" {
  interface AuthenticationTypes {
    user: AdministradorActual;
  }
}
