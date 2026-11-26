import type { Reloj } from "./entities/reloj.entity.js";

/** El reloj como lo recibe el front: con su marca y su galería ordenada. */
export function aRelojDto(reloj: Reloj) {
  return {
    id: reloj.id,
    marca: { id: reloj.marca.id, nombre: reloj.marca.nombre },
    nombre: reloj.nombre,
    genero: reloj.genero,
    precioCop: reloj.precioCop,
    cantidad: reloj.cantidad,
    garantia: reloj.garantia,
    detalleMecanica: reloj.detalleMecanica,
    descripcion: reloj.descripcion,
    modo: reloj.modo,
    visible: reloj.visible,
    plazoEstimado: reloj.plazoEstimado,
    urlAmigable: reloj.urlAmigable,
    imagenes: ordenarImagenes(reloj).map((imagen) => ({
      id: imagen.id,
      archivo: imagen.archivo,
      orden: imagen.orden,
      esPrincipal: imagen.esPrincipal,
    })),
    fechaPublicacion: reloj.fechaPublicacion,
    fechaActualizacion: reloj.fechaActualizacion,
  };
}

/** Lo que muestra cada tarjeta del catálogo (REQ-CAT-2). */
export function aResumenDto(reloj: Reloj) {
  const imagenes = ordenarImagenes(reloj);
  const principal = imagenes.find((imagen) => imagen.esPrincipal) ?? imagenes[0];
  return {
    id: reloj.id,
    marca: { id: reloj.marca.id, nombre: reloj.marca.nombre },
    nombre: reloj.nombre,
    precioCop: reloj.precioCop,
    modo: reloj.modo,
    urlAmigable: reloj.urlAmigable,
    imagenPrincipal: {
      id: principal.id,
      archivo: principal.archivo,
      orden: principal.orden,
      esPrincipal: principal.esPrincipal,
    },
  };
}

function ordenarImagenes(reloj: Reloj) {
  return reloj.imagenes.toSorted((a, b) => a.orden - b.orden);
}
