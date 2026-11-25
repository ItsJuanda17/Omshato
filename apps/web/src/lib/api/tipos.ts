/**
 * Tipos de dominio de Omshato, alineados con el modelo relacional
 * (docs/architecture/03_base_de_datos). Los nombres siguen el dominio en español.
 *
 * Las fechas viajan como texto ISO 8601, que es lo que devolverá la API real.
 */

/** RN-1: un reloj está en exactamente uno de dos modos. */
export type ModoReloj = "DISPONIBLE" | "BAJO_PEDIDO";

export interface Marca {
  id: number;
  nombre: string;
}

export interface ImagenReloj {
  id: number;
  /** Ruta o clave de la imagen en el almacenamiento. */
  archivo: string;
  /** Posición en la galería, desde 1. */
  orden: number;
  esPrincipal: boolean;
}

export interface Reloj {
  id: number;
  marca: Marca;
  nombre: string;
  /** Texto libre. Los valores posibles están por definir (TBD-5). */
  genero: string;
  /** Entero positivo en pesos colombianos. */
  precioCop: number;
  /** Unidades en mano. Nulo cuando el reloj es Bajo pedido (TBD-2). */
  cantidad: number | null;
  garantia: string;
  /**
   * Un solo campo de texto (TBD-6). Por convención, una línea por dato con el
   * formato "Clave: valor", por ejemplo "Calibre: Powermatic 80.111".
   */
  detalleMecanica: string | null;
  descripcion: string | null;
  modo: ModoReloj;
  /** Solo los relojes visibles aparecen en el catálogo y se pueden pedir. */
  visible: boolean;
  /** Solo aplica a Bajo pedido. Texto libre, por ejemplo "8 a 15 días hábiles" (TBD-7). */
  plazoEstimado: string | null;
  /** Segmento propio y estable de la URL (REQ-CAT-7). */
  urlAmigable: string;
  /** Ordenadas por `orden`. Siempre hay una principal. */
  imagenes: ImagenReloj[];
  fechaPublicacion: string;
  fechaActualizacion: string;
}

/** Lo que muestra cada tarjeta del catálogo (REQ-CAT-2). */
export interface RelojResumen {
  id: number;
  marca: Marca;
  nombre: string;
  precioCop: number;
  modo: ModoReloj;
  urlAmigable: string;
  imagenPrincipal: ImagenReloj;
}

export interface Departamento {
  id: number;
  codigoDane: string;
  nombre: string;
}

export interface Ciudad {
  id: number;
  idDepartamento: number;
  codigoDane: string;
  nombre: string;
}

/** Estados de la Tabla 2 del SRS. */
export type EstadoPedido =
  | "RECIBIDO"
  | "POR_CONSEGUIR_CON_PROVEEDOR"
  | "CONFIRMADO"
  | "ENVIADO"
  | "ENTREGADO"
  | "CANCELADO";

/** Una fila por cada estado por el que pasa el pedido, incluida la inicial. */
export interface HistorialEstado {
  id: number;
  /** El estado nuevo. El anterior es la fila previa. */
  estado: EstadoPedido;
  /** Nulo en la fila inicial, que registra el sistema. */
  idAdministrador: number | null;
  fechaHora: string;
}

export interface Pedido {
  id: number;
  /** Número visible para el comprador, por ejemplo "OMS-0843" (REQ-PED-8). */
  numeroPedido: string;
  idReloj: number;
  estado: EstadoPedido;
  departamento: Departamento;
  ciudad: Ciudad;
  /** Copia del reloj al momento de la compra: no cambia si luego se edita (RN-7). */
  nombreReloj: string;
  precioReloj: number;
  modoReloj: ModoReloj;
  nombreComprador: string;
  /** Exactamente 10 dígitos (TBD-21). */
  telefonoComprador: string;
  direccion: string;
  /** Evidencia de la autorización de datos personales, Ley 1581 de 2012. */
  fechaAutorizacionDatos: string;
  motivoCancelacion: string | null;
  fechaCreacion: string;
  historial: HistorialEstado[];
}

/**
 * Resultado de registrar un pedido. Los rechazos de negocio se devuelven como
 * dato y no como excepción, para que el formulario conserve lo que escribió la persona.
 */
export type ResultadoCrearPedido =
  | { ok: true; pedido: Pedido }
  | { ok: false; codigo: "RELOJ_NO_DISPONIBLE" | "DATOS_INVALIDOS"; mensaje: string };
