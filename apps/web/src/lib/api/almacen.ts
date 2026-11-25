import { ciudadesEjemplo, departamentosEjemplo } from "@/lib/api/datos-colombia";
import { marcasEjemplo, relojesEjemplo } from "@/lib/api/datos-ejemplo";
import type { Ciudad, Departamento, Marca, Pedido, Reloj } from "@/lib/api/tipos";

/**
 * Almacén en memoria que hace de base de datos mientras no exista la API.
 * Vive en el servidor y se guarda en `globalThis` para que sobreviva a las
 * recargas en caliente y lo compartan todos los módulos. Se reinicia al
 * reiniciar el servidor.
 *
 * Solo lo usan los servicios de `lib/api`. Al conectar la API real se elimina.
 */
interface Almacen {
  marcas: Marca[];
  relojes: Reloj[];
  departamentos: Departamento[];
  ciudades: Ciudad[];
  pedidos: Pedido[];
  /** Clave de idempotencia → número del pedido que la usó primero. */
  clavesIdempotencia: Map<string, string>;
}

const global = globalThis as unknown as { __omshatoAlmacen?: Almacen };

export function obtenerAlmacen(): Almacen {
  global.__omshatoAlmacen ??= {
    marcas: structuredClone(marcasEjemplo),
    relojes: structuredClone(relojesEjemplo),
    departamentos: structuredClone(departamentosEjemplo),
    ciudades: structuredClone(ciudadesEjemplo),
    pedidos: [],
    clavesIdempotencia: new Map(),
  };
  return global.__omshatoAlmacen;
}

/** Simula el tiempo de respuesta de una API para que se vean los estados de carga. */
export function simularLatencia(milisegundos = 120) {
  return new Promise<void>((resolver) => setTimeout(resolver, milisegundos));
}
