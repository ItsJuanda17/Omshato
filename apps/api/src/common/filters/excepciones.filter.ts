import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { HttpAdapterHost } from "@nestjs/core";

/** Cuerpo de todos los errores del API. El front se apoya en `codigo`, no en el texto. */
export interface CuerpoError {
  estado: number;
  codigo: string;
  mensaje: string;
  /** Detalle por campo cuando falla la validación. */
  detalles?: { campo: string; mensaje: string }[];
  ruta: string;
  fecha: string;
}

const codigosPorEstado: Record<number, string> = {
  400: "DATOS_INVALIDOS",
  401: "NO_AUTENTICADO",
  403: "SIN_PERMISO",
  404: "NO_ENCONTRADO",
  405: "METODO_NO_PERMITIDO",
  409: "CONFLICTO",
  413: "ARCHIVO_MUY_GRANDE",
  415: "TIPO_NO_PERMITIDO",
  422: "NO_PROCESABLE",
  429: "DEMASIADAS_SOLICITUDES",
};

/** Códigos que emiten los paquetes de Nest y su equivalente estable del API. */
const alias: Record<string, string> = {
  missing_credentials: "NO_AUTENTICADO",
};

/** Texto en español para los mensajes genéricos en inglés que Nest y sus paquetes ponen por defecto. */
const mensajesPorEstado: Record<number, string> = {
  400: "La solicitud no es válida.",
  401: "Inicia sesión para continuar.",
  403: "No tienes permiso para hacer esto.",
  404: "No encontramos lo que buscas.",
  405: "Este método no está permitido.",
  409: "La solicitud entra en conflicto con el estado actual.",
  413: "El archivo es demasiado grande. Usa una foto de máximo 5 MB.",
  415: "Solo se aceptan fotos en formato JPG, PNG, WebP o AVIF.",
  422: "No pudimos procesar la solicitud.",
  429: "Demasiadas solicitudes. Inténtalo más tarde.",
};

const GENERICOS_EN = new Set([
  "Bad Request",
  "Unauthorized",
  "Forbidden",
  "Not Found",
  "Method Not Allowed",
  "Conflict",
  "Unprocessable Entity",
  "Too Many Requests",
]);

function esGenerico(mensaje: string) {
  return (
    GENERICOS_EN.has(mensaje) ||
    /^Cannot (GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS) /.test(mensaje) ||
    mensaje.startsWith("ThrottlerException")
  );
}

const MENSAJE_VALIDACION = "Los datos enviados no son válidos.";
const MENSAJE_INESPERADO = "Ocurrió un error inesperado. Inténtalo de nuevo.";

/** `"correo: Correo inválido"` pasa a `{ campo: "correo", mensaje: "Correo inválido" }`. */
function separarCampo(texto: string) {
  const posicion = texto.indexOf(": ");
  return posicion === -1
    ? { campo: "", mensaje: texto }
    : { campo: texto.slice(0, posicion), mensaje: texto.slice(posicion + 2) };
}

/**
 * Convierte cualquier excepción en una respuesta uniforme. Los errores que no
 * son `HttpException` no filtran su mensaje: se registran y el cliente recibe
 * un texto genérico. Nunca se registra el cuerpo de la solicitud, porque puede
 * traer datos personales (SEI-4).
 */
@Catch()
export class FiltroExcepciones implements ExceptionFilter {
  private readonly logger = new Logger(FiltroExcepciones.name);

  constructor(private readonly adaptador: HttpAdapterHost) {}

  catch(excepcion: unknown, host: ArgumentsHost) {
    const { httpAdapter } = this.adaptador;
    const contexto = host.switchToHttp();
    const cuerpo = this.construirCuerpo(
      excepcion,
      httpAdapter.getRequestUrl(contexto.getRequest()),
    );

    if (cuerpo.estado >= 500) {
      const detalle =
        excepcion instanceof Error ? (excepcion.stack ?? excepcion.message) : String(excepcion);
      this.logger.error(`${cuerpo.codigo} en ${cuerpo.ruta}`, detalle);
    }

    httpAdapter.reply(contexto.getResponse(), cuerpo, cuerpo.estado);
  }

  private construirCuerpo(excepcion: unknown, ruta: string): CuerpoError {
    const base = { ruta: ruta.split("?")[0], fecha: new Date().toISOString() };

    if (!(excepcion instanceof HttpException)) {
      return {
        estado: HttpStatus.INTERNAL_SERVER_ERROR,
        codigo: "ERROR_INTERNO",
        mensaje: MENSAJE_INESPERADO,
        ...base,
      };
    }

    const estado = excepcion.getStatus();
    const respuesta = excepcion.getResponse();
    const objeto = typeof respuesta === "object" ? (respuesta as Record<string, unknown>) : {};
    // Un `errorCode` explícito de la excepción tiene prioridad sobre el del estado HTTP.
    const codigo =
      typeof objeto.errorCode === "string"
        ? (alias[objeto.errorCode] ?? objeto.errorCode)
        : (codigosPorEstado[estado] ?? (estado >= 500 ? "ERROR_INTERNO" : "ERROR"));

    if (estado >= 500) {
      return { estado, codigo, mensaje: MENSAJE_INESPERADO, ...base };
    }

    // La validación de Nest entrega un arreglo de textos "campo: mensaje".
    if (Array.isArray(objeto.message)) {
      return {
        estado,
        codigo,
        mensaje: MENSAJE_VALIDACION,
        detalles: objeto.message.map((m) => separarCampo(String(m))),
        ...base,
      };
    }

    const original =
      typeof respuesta === "string"
        ? respuesta
        : typeof objeto.message === "string"
          ? objeto.message
          : excepcion.message;
    // Los textos de subida de archivos vienen de multer en inglés y no se pueden confundir con uno propio.
    const esDeSubida = estado === 413 || estado === 415;
    const mensaje =
      esDeSubida || esGenerico(original) ? (mensajesPorEstado[estado] ?? original) : original;
    return { estado, codigo, mensaje, ...base };
  }
}
