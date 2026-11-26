import "server-only";

import type { ErrorApi } from "@omshato/contratos";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import type { Resultado } from "@/lib/api/tipos";

/**
 * Cliente del API. Solo corre en el servidor de Next: el navegador habla con Next y Next habla
 * con el API. Así la cookie de sesión del API nunca pasa por JavaScript del navegador y el API
 * no necesita CORS para el sitio.
 */

const URL_API = process.env.API_URL ?? "http://localhost:3001";
const TIEMPO_MAXIMO_MS = 15_000;

/** La cookie del front que guarda el token de sesión que entregó el API. */
export const COOKIE_SESION = "omshato_sesion";
/** El nombre con el que el API espera ese token. */
export const COOKIE_DEL_API = "__Host-sid";

export type RespuestaApi<T> =
  | { ok: true; estado: number; dato: T; cabeceras: Headers }
  | { ok: false; estado: number; error: ErrorApi };

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  /** Se envía como JSON. */
  cuerpo?: unknown;
  /** Se envía como formulario con archivos. */
  formulario?: FormData;
  /** Envía la sesión del administrador. Sin sesión, el API responde 401 y se lleva al inicio de sesión. */
  conSesion?: boolean;
  /** Reenvía la IP del visitante, para que el límite de solicitudes cuente por persona (SEI-8). */
  reenviarIp?: boolean;
  /** Segundos que puede reutilizarse la respuesta. Por defecto, nunca. */
  revalidar?: number;
}

function errorDeRed(): ErrorApi {
  return {
    estado: 0,
    codigo: "API_NO_DISPONIBLE",
    mensaje: "No pudimos conectar con el servidor. Inténtalo de nuevo en unos minutos.",
    ruta: "",
    fecha: new Date().toISOString(),
  };
}

/** Llama al API. Nunca lanza: una caída de red es una respuesta con `estado: 0`. */
export async function llamarApi<T>(
  ruta: string,
  { metodo = "GET", cuerpo, formulario, conSesion, reenviarIp, revalidar }: Opciones = {},
): Promise<RespuestaApi<T>> {
  const cabeceras = new Headers({ Accept: "application/json" });

  if (conSesion) {
    const token = (await cookies()).get(COOKIE_SESION)?.value;
    if (token) cabeceras.set("Cookie", `${COOKIE_DEL_API}=${token}`);
  }
  if (reenviarIp) {
    const entrantes = await headers();
    const ip = entrantes.get("x-forwarded-for") ?? entrantes.get("x-real-ip");
    if (ip) cabeceras.set("X-Forwarded-For", ip);
  }
  if (cuerpo !== undefined) cabeceras.set("Content-Type", "application/json");

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_API}/api${ruta}`, {
      method: metodo,
      headers: cabeceras,
      body: formulario ?? (cuerpo === undefined ? undefined : JSON.stringify(cuerpo)),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
      ...(revalidar ? { next: { revalidate: revalidar } } : { cache: "no-store" as const }),
    });
  } catch {
    return { ok: false, estado: 0, error: errorDeRed() };
  }

  const esJson = respuesta.headers.get("content-type")?.includes("application/json");
  const contenido: unknown = esJson ? await respuesta.json().catch(() => null) : null;

  if (!respuesta.ok) {
    const error =
      contenido && typeof contenido === "object" && "codigo" in contenido
        ? (contenido as ErrorApi)
        : { ...errorDeRed(), estado: respuesta.status, codigo: "ERROR_SERVIDOR" };
    return { ok: false, estado: respuesta.status, error };
  }
  return { ok: true, estado: respuesta.status, dato: contenido as T, cabeceras: respuesta.headers };
}

/** Sin sesión válida no hay panel: lleva al inicio de sesión, como antes con la sesión simulada. */
function exigirSesionSiHaceFalta(respuesta: RespuestaApi<unknown>, conSesion?: boolean) {
  if (conSesion && !respuesta.ok && respuesta.estado === 401) redirect("/admin/login");
}

/**
 * Para lecturas: devuelve el dato o lanza, y Next muestra la pantalla de error. Con
 * `nuloSiNoExiste`, un 404 es `null` (un reloj o un pedido que no existen no son un fallo).
 */
export async function leerApi<T>(
  ruta: string,
  opciones: Opciones & { nuloSiNoExiste: true },
): Promise<T | null>;
export async function leerApi<T>(ruta: string, opciones?: Opciones): Promise<T>;
export async function leerApi<T>(
  ruta: string,
  opciones: Opciones & { nuloSiNoExiste?: boolean } = {},
) {
  const respuesta = await llamarApi<T>(ruta, opciones);
  if (respuesta.ok) return respuesta.dato;
  exigirSesionSiHaceFalta(respuesta, opciones.conSesion);
  if (opciones.nuloSiNoExiste && respuesta.estado === 404) return null;
  throw new Error(`El API respondió ${respuesta.estado} ${respuesta.error.codigo} en ${ruta}`);
}

/** El primer mensaje útil de un error: el del primer campo inválido, o el general. */
export function mensajeDeError(error: ErrorApi) {
  return error.detalles?.[0]?.mensaje ?? error.mensaje;
}

/**
 * Para acciones del panel: los rechazos de negocio (reloj con pedidos, transición no permitida,
 * datos inválidos) viajan como dato para que el formulario conserve lo que escribió la persona.
 * Una caída de red o un 500 también, con un texto que no asusta ni filtra detalles.
 */
export async function ejecutarApi<T>(ruta: string, opciones: Opciones = {}): Promise<Resultado<T>> {
  const respuesta = await llamarApi<T>(ruta, opciones);
  if (respuesta.ok) return { ok: true, dato: respuesta.dato };
  exigirSesionSiHaceFalta(respuesta, opciones.conSesion);

  const { error, estado } = respuesta;
  if (estado === 0 || estado >= 500) {
    return {
      ok: false,
      codigo: "ERROR_SERVIDOR",
      mensaje: "No pudimos completar la acción. Inténtalo de nuevo en unos minutos.",
    };
  }
  return { ok: false, codigo: error.codigo, mensaje: mensajeDeError(error) };
}
