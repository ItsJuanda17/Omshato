import { ciudadesEjemplo, departamentosEjemplo } from "@/lib/api/datos-colombia";
import { marcasEjemplo, relojesEjemplo } from "@/lib/api/datos-ejemplo";
import { enlacesEjemplo, pedidosEjemplo } from "@/lib/api/datos-pedidos";
import type {
  Ciudad,
  Departamento,
  EnlaceContacto,
  Marca,
  Pedido,
  Reloj,
} from "@/lib/api/tipos";

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
  enlaces: EnlaceContacto[];
  /** Clave de idempotencia → número del pedido que la usó primero. */
  clavesIdempotencia: Map<string, string>;
  /** Intentos fallidos de inicio de sesión por correo (REQ-AUT-4). */
  intentosSesion: Map<string, { intentos: number; bloqueadoHasta: number | null }>;
  /** Identificadores de las sesiones abiertas del administrador. */
  sesiones: Set<string>;
}

const global = globalThis as unknown as { __omshatoAlmacen?: Almacen };

export function obtenerAlmacen(): Almacen {
  global.__omshatoAlmacen ??= {
    marcas: structuredClone(marcasEjemplo),
    relojes: structuredClone(relojesEjemplo),
    departamentos: structuredClone(departamentosEjemplo),
    ciudades: structuredClone(ciudadesEjemplo),
    pedidos: structuredClone(pedidosEjemplo),
    enlaces: structuredClone(enlacesEjemplo),
    clavesIdempotencia: new Map(),
    intentosSesion: new Map(),
    sesiones: new Set(),
  };
  return global.__omshatoAlmacen;
}

/** Simula el tiempo de respuesta de una API para que se vean los estados de carga. */
export function simularLatencia(milisegundos = 120) {
  return new Promise<void>((resolver) => setTimeout(resolver, milisegundos));
}
