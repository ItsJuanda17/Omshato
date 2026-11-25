"use server";

import { obtenerAlmacen, simularLatencia } from "@/lib/api/almacen";
import type { Pedido, ResultadoCrearPedido } from "@/lib/api/tipos";
import { esquemaNuevoPedido, type NuevoPedido } from "@/lib/validaciones/pedido";

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
  };

  almacen.pedidos.push(pedido);
  almacen.clavesIdempotencia.set(entrada.claveIdempotencia, pedido.numeroPedido);
  return { ok: true, pedido: structuredClone(pedido) };
}
