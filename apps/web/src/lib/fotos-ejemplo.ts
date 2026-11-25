/**
 * Biblioteca de fotos de ejemplo que el panel ofrece al armar un reloj.
 * La subida real de archivos (JPG, PNG o WebP, con tamaño máximo: TBD-13)
 * llega con el backend y el almacenamiento de imágenes.
 */
export const fotosDeEjemplo = [
  { archivo: "/relojes/frontal-1.png", descripcion: "Esfera oscura con fecha" },
  { archivo: "/relojes/frontal-2.png", descripcion: "Esfera clara" },
  { archivo: "/relojes/frontal-3.png", descripcion: "Cronógrafo" },
  { archivo: "/relojes/frontal-4.png", descripcion: "Esqueleto" },
  { archivo: "/relojes/reverso.png", descripcion: "Fondo de la caja" },
  { archivo: "/relojes/detalle.png", descripcion: "Detalle de la esfera" },
] as const;

export function descripcionFoto(archivo: string) {
  return fotosDeEjemplo.find((foto) => foto.archivo === archivo)?.descripcion ?? "Foto";
}
