"use server";

import { obtenerAlmacen, simularLatencia } from "@/lib/api/almacen";
import type { EstadoPedido, Pedido, Resultado, ResultadoCrearPedido } from "@/lib/api/tipos";
import { requerirSesion } from "@/lib/auth/sesion";
import { etiquetasEstado, puedeCambiar } from "@/lib/pedidos/estados";
import {
  esquemaMotivoCancelacion,
  esquemaNota,
  esquemaNuevoPedido,
  type NuevoPedido,
} from "@/lib/validaciones/pedido";

function siguienteNumero(pedidos: Pedido[]) {
  const mayor = pedidos.reduce((max, p) => Math.max(max, Number(p.numeroPedido.slice(4))), 0);
  return `OMS-${String(mayor + 1).padStart(4, "0")}`;
}

/**
 * Registra un pedido sin cuenta (REQ-PED-1). Un pedido lleva un solo reloj.
 * El estado inicial depende del modo del reloj (REQ-PED-9) y el pedido guarda
 * el nombre y el precio vigentes (REQ-PED-10).
 */
export async function crearPedido(datos: NuevoPedido): Promise<ResultadoCrearPedido> {
  await simularLatencia(400);

  const validacion = esquemaNuevoPedido.safeParse(datos);
  if (!validacion.success) {
    return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: "Revisa los datos del formulario." };
  }
  const entrada = validacion.data;
  const almacen = obtenerAlmacen();

  // REQ-PED-12: el mismo envío repetido devuelve el pedido ya registrado.
  const numeroPrevio = almacen.clavesIdempotencia.get(entrada.claveIdempotencia);
  const pedidoPrevio = almacen.pedidos.find((p) => p.numeroPedido === numeroPrevio);
  if (pedidoPrevio) return { ok: true, pedido: structuredClone(pedidoPrevio) };

  // REQ-PED-11: un reloj oculto o retirado no se puede pedir.
  const reloj = almacen.relojes.find((r) => r.id === entrada.idReloj && r.visible);
  if (!reloj) {
    return {
      ok: false,
      codigo: "RELOJ_NO_DISPONIBLE",
      mensaje:
        "Este reloj ya no está disponible en el catálogo, así que no pudimos registrar tu pedido.",
    };
  }

  const ciudad = almacen.ciudades.find((c) => c.id === entrada.idCiudad);
  const departamento = almacen.departamentos.find((d) => d.id === ciudad?.idDepartamento);
  if (!ciudad || !departamento) {
    return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: "Elige una ciudad de la lista." };
  }

  const ahora = new Date().toISOString();
  const estado = reloj.modo === "DISPONIBLE" ? "RECIBIDO" : "POR_CONSEGUIR_CON_PROVEEDOR";
  const pedido: Pedido = {
    id: almacen.pedidos.reduce((max, p) => Math.max(max, p.id), 0) + 1,
    numeroPedido: siguienteNumero(almacen.pedidos),
    idReloj: reloj.id,
    estado,
    departamento,
    ciudad,
    nombreReloj: `${reloj.marca.nombre} ${reloj.nombre}`,
    precioReloj: reloj.precioCop,
    modoReloj: reloj.modo,
    nombreComprador: entrada.nombreComprador,
    telefonoComprador: entrada.telefonoComprador,
    direccion: entrada.direccion,
    fechaAutorizacionDatos: ahora,
    motivoCancelacion: null,
    fechaCreacion: ahora,
    historial: [{ id: 1, estado, idAdministrador: null, fechaHora: ahora }],
    notas: [],
  };

  almacen.pedidos.push(pedido);
  almacen.clavesIdempotencia.set(entrada.claveIdempotencia, pedido.numeroPedido);
  return { ok: true, pedido: structuredClone(pedido) };
}

/** Lista de pedidos del panel, del más reciente al más antiguo (REQ-GPE-1). */
export async function listarPedidos(): Promise<Pedido[]> {
  await requerirSesion();
  await simularLatencia();
  return structuredClone(
    obtenerAlmacen().pedidos.toSorted((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion)),
  );
}

/** Detalle de un pedido con su historial y sus notas (REQ-GPE-3). */
export async function obtenerPedido(idPedido: number): Promise<Pedido | null> {
  await requerirSesion();
  await simularLatencia();
  const pedido = obtenerAlmacen().pedidos.find((p) => p.id === idPedido);
  return pedido ? structuredClone(pedido) : null;
}

/**
 * Cambia el estado de un pedido. Solo permite las transiciones de la Tabla 2 del
 * SRS (REQ-GPE-5) y exige un motivo al cancelar (REQ-GPE-6). Registra quién y
 * cuándo lo hizo (REQ-GPE-7).
 */
export async function cambiarEstadoPedido(datos: {
  idPedido: number;
  estado: EstadoPedido;
  /** Obligatorio solo para Cancelado. */
  motivo?: string;
}): Promise<Resultado<Pedido>> {
  const sesion = await requerirSesion();
  await simularLatencia(250);

  const pedido = obtenerAlmacen().pedidos.find((p) => p.id === datos.idPedido);
  if (!pedido) return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "No encontramos ese pedido." };

  if (!puedeCambiar(pedido.estado, datos.estado)) {
    return {
      ok: false,
      codigo: "TRANSICION_NO_PERMITIDA",
      mensaje: `Un pedido en estado «${etiquetasEstado[pedido.estado]}» no puede pasar a «${etiquetasEstado[datos.estado]}».`,
    };
  }

  let motivo: string | null = null;
  if (datos.estado === "CANCELADO") {
    const validacion = esquemaMotivoCancelacion.safeParse(datos.motivo ?? "");
    if (!validacion.success) {
      return { ok: false, codigo: "MOTIVO_REQUERIDO", mensaje: validacion.error.issues[0].message };
    }
    motivo = validacion.data;
  }

  pedido.estado = datos.estado;
  if (motivo) pedido.motivoCancelacion = motivo;
  pedido.historial.push({
    id: pedido.historial.reduce((max, h) => Math.max(max, h.id), 0) + 1,
    estado: datos.estado,
    idAdministrador: sesion.idAdministrador,
    fechaHora: new Date().toISOString(),
  });
  return { ok: true, dato: structuredClone(pedido) };
}

/** Agrega una nota interna a un pedido (REQ-GPE-11). */
export async function agregarNotaPedido(datos: {
  idPedido: number;
  texto: string;
}): Promise<Resultado<Pedido>> {
  const sesion = await requerirSesion();
  await simularLatencia(200);

  const pedido = obtenerAlmacen().pedidos.find((p) => p.id === datos.idPedido);
  if (!pedido) return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "No encontramos ese pedido." };

  const validacion = esquemaNota.safeParse(datos.texto);
  if (!validacion.success) {
    return { ok: false, codigo: "NOTA_INVALIDA", mensaje: validacion.error.issues[0].message };
  }

  pedido.notas.push({
    id: pedido.notas.reduce((max, n) => Math.max(max, n.id), 0) + 1,
    idAdministrador: sesion.idAdministrador,
    texto: validacion.data,
    fechaHora: new Date().toISOString(),
  });
  return { ok: true, dato: structuredClone(pedido) };
}
