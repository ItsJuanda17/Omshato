/**
 * La dirección con la que el navegador pide una foto. El API guarda la clave (`relojes/<id>.png`);
 * Next la sirve bajo `/fotos/…` y la trae del API (ver `rewrites` en next.config.ts).
 */
export function urlFoto(archivo: string) {
  return `/fotos/${archivo}`;
}
