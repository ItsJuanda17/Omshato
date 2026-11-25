export interface Especificacion {
  clave: string;
  valor: string;
}

/**
 * Convierte el campo `detalleMecanica` (una línea "Clave: valor" por dato) en filas.
 * Una línea sin dos puntos queda como valor sin clave.
 */
export function parsearEspecificaciones(texto: string | null): Especificacion[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((linea) => linea.trim())
    .filter(Boolean)
    .map((linea) => {
      const separador = linea.indexOf(":");
      if (separador === -1) return { clave: "", valor: linea };
      return { clave: linea.slice(0, separador).trim(), valor: linea.slice(separador + 1).trim() };
    });
}
