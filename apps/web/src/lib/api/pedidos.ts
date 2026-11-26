"use server";

import { ejecutarApi, leerApi, llamarApi, mensajeDeError } from "@/lib/api/cliente";
import type {
  EstadoPedido,
  NuevoPedido,
  Pedido,
  PedidoPublico,
  Resultado,
  ResultadoCrearPedido,
} from "@/lib/api/tipos";

/**
 * Registra un pedido sin cuenta (REQ-PED-1). El API decide el estado inicial según el modo
 * del reloj (REQ-PED-9), guarda el nombre y el precio vigentes (REQ-PED-10) y, si el mismo
 * envío llega dos veces, devuelve el pedido ya registrado (REQ-PED-12).
 */
export async function crearPedido(datos: NuevoPedido): Promise<ResultadoCrearPedido> {
  const respuesta = await llamarApi<PedidoPublico>("/pedidos", {
    metodo: "POST",
    cuerpo: datos,
    reenviarIp: true,
  });
  if (respuesta.ok) return { ok: true, pedido: respuesta.dato };

  const { estado, error } = respuesta;
  if (error.codigo === "RELOJ_NO_DISPONIBLE") {
    return { ok: false, codigo: "RELOJ_NO_DISPONIBLE", mensaje: error.mensaje };
  }
  if (estado === 429) {
    return {
      ok: false,
      codigo: "DEMASIADAS_SOLICITUDES",
      mensaje: "Enviaste demasiados pedidos seguidos. Espera unos minutos e inténtalo de nuevo.",
    };
  }
  if (estado === 400 || estado === 422) {
    return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: mensajeDeError(error) };
  }
  return {
    ok: false,
    codigo: "ERROR_SERVIDOR",
    mensaje: "No pudimos registrar tu pedido. Tus datos siguen aquí; inténtalo de nuevo.",
  };
}

/** Lista de pedidos del panel, del más reciente al más antiguo (REQ-GPE-1). */
export async function listarPedidos(): Promise<Pedido[]> {
  return leerApi<Pedido[]>("/admin/pedidos", { conSesion: true });
}

/** Detalle de un pedido con su historial y sus notas (REQ-GPE-3). */
export async function obtenerPedido(idPedido: number): Promise<Pedido | null> {
  return leerApi<Pedido>(`/admin/pedidos/${idPedido}`, {
    conSesion: true,
    nuloSiNoExiste: true,
  });
}

/**
 * Cambia el estado de un pedido. El API solo permite las transiciones de la Tabla 2 del SRS
 * (REQ-GPE-5), exige un motivo al cancelar (REQ-GPE-6) y registra quién y cuándo lo hizo
 * (REQ-GPE-7).
 */
export async function cambiarEstadoPedido(datos: {
  idPedido: number;
  estado: EstadoPedido;
  /** Obligatorio solo para Cancelado. */
  motivo?: string;
}): Promise<Resultado<Pedido>> {
  return ejecutarApi<Pedido>(`/admin/pedidos/${datos.idPedido}/estado`, {
    metodo: "POST",
    cuerpo: { estado: datos.estado, motivo: datos.motivo },
    conSesion: true,
  });
}

/** Agrega una nota interna a un pedido (REQ-GPE-11). */
export async function agregarNotaPedido(datos: {
  idPedido: number;
  texto: string;
}): Promise<Resultado<Pedido>> {
  return ejecutarApi<Pedido>(`/admin/pedidos/${datos.idPedido}/notas`, {
    metodo: "POST",
    cuerpo: { texto: datos.texto },
    conSesion: true,
  });
}
