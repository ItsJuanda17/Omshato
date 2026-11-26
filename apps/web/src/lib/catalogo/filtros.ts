import type { ModoReloj, RelojResumen } from "@/lib/api/tipos";
import { normalizar, slugificar } from "@/lib/formato";

/**
 * Filtros del catálogo. Viven en la URL (?q=&marca=&disponibilidad=&min=&max=),
 * así se pueden compartir y la navegación "Bajo pedido" del encabezado funciona.
 */
export interface FiltrosCatalogo {
  busqueda: string;
  /** Marca como segmento de URL, por ejemplo "orient-star". */
  marca: string | null;
  modo: ModoReloj | null;
  precioMin: number | null;
  precioMax: number | null;
}

export const filtrosVacios: FiltrosCatalogo = {
  busqueda: "",
  marca: null,
  modo: null,
  precioMin: null,
  precioMax: null,
};

const modosPorUrl: Record<string, ModoReloj> = {
  disponible: "DISPONIBLE",
  "bajo-pedido": "BAJO_PEDIDO",
};

export const urlPorModo: Record<ModoReloj, string> = {
  DISPONIBLE: "disponible",
  BAJO_PEDIDO: "bajo-pedido",
};

/** Convierte un texto de dígitos en un entero positivo, o nulo si no lo es. */
export function leerPrecio(texto: string | null | undefined) {
  const limpio = (texto ?? "").replace(/\D/g, "");
  if (!limpio) return null;
  const valor = Number(limpio);
  return Number.isSafeInteger(valor) && valor > 0 ? valor : null;
}

export function leerFiltros(params: Pick<URLSearchParams, "get">): FiltrosCatalogo {
  const precioMin = leerPrecio(params.get("min"));
  const precioMax = leerPrecio(params.get("max"));
  const rangoValido = precioMin === null || precioMax === null || precioMin <= precioMax;

  return {
    busqueda: params.get("q")?.trim() ?? "",
    marca: params.get("marca") || null,
    modo: modosPorUrl[params.get("disponibilidad") ?? ""] ?? null,
    // REQ-FIL-5: con un rango invertido no se aplica el filtro de precio.
    precioMin: rangoValido ? precioMin : null,
    precioMax: rangoValido ? precioMax : null,
  };
}

/** Texto de la URL (sin "?") que representa los filtros. Vacío si no hay ninguno. */
export function escribirFiltros(filtros: FiltrosCatalogo) {
  const params = new URLSearchParams();
  if (filtros.busqueda) params.set("q", filtros.busqueda);
  if (filtros.marca) params.set("marca", filtros.marca);
  if (filtros.modo) params.set("disponibilidad", urlPorModo[filtros.modo]);
  if (filtros.precioMin !== null) params.set("min", String(filtros.precioMin));
  if (filtros.precioMax !== null) params.set("max", String(filtros.precioMax));
  return params.toString();
}

/** REQ-FIL-5. Devuelve el mensaje de error o nulo si el rango es válido. */
export function validarRangoPrecio(min: number | null, max: number | null) {
  if (min !== null && max !== null && min > max) {
    return "El precio mínimo no puede ser mayor que el máximo.";
  }
  return null;
}

export function filtrarRelojes(relojes: RelojResumen[], filtros: FiltrosCatalogo) {
  const busqueda = normalizar(filtros.busqueda);

  return relojes.filter((reloj) => {
    if (filtros.marca && slugificar(reloj.marca.nombre) !== filtros.marca) return false;
    if (filtros.modo && reloj.modo !== filtros.modo) return false;
    if (filtros.precioMin !== null && reloj.precioCop < filtros.precioMin) return false;
    if (filtros.precioMax !== null && reloj.precioCop > filtros.precioMax) return false;
    if (busqueda && !normalizar(`${reloj.marca.nombre} ${reloj.nombre}`).includes(busqueda)) {
      return false;
    }
    return true;
  });
}

export function hayFiltros(filtros: FiltrosCatalogo) {
  return escribirFiltros(filtros) !== "";
}
