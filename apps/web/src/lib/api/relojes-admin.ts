"use server";

/**
 * Servicio de relojes del panel. A diferencia del catálogo público, ve todos
 * los relojes, visibles y ocultos. Todo exige sesión (REQ-AUT-1).
 */

import { obtenerAlmacen, simularLatencia } from "@/lib/api/mock/almacen";
import type { Marca, ModoReloj, RelojAdmin, Reloj, Resultado } from "@/lib/api/tipos";
import { requerirSesion } from "@/lib/auth/sesion";
import { slugificar } from "@/lib/formato";
import { esquemaDatosReloj, type DatosReloj } from "@/lib/validaciones/reloj";

function conPedidos(reloj: Reloj): RelojAdmin {
  const cantidadPedidos = obtenerAlmacen().pedidos.filter((p) => p.idReloj === reloj.id).length;
  return structuredClone({ ...reloj, cantidadPedidos });
}

/** URL propia y estable (REQ-CAT-7). Si ya existe, se agrega un número. */
function urlUnica(texto: string, existentes: string[]) {
  const base = slugificar(texto) || "reloj";
  let candidata = base;
  for (let n = 2; existentes.includes(candidata); n++) candidata = `${base}-${n}`;
  return candidata;
}

/** Todos los relojes, visibles y ocultos, del más reciente al más antiguo (REQ-ADM-11). */
export async function listarRelojesAdmin(): Promise<RelojAdmin[]> {
  await requerirSesion();
  await simularLatencia();
  return obtenerAlmacen()
    .relojes.toSorted((a, b) => b.fechaPublicacion.localeCompare(a.fechaPublicacion))
    .map(conPedidos);
}

export async function obtenerRelojAdmin(idReloj: number): Promise<RelojAdmin | null> {
  await requerirSesion();
  await simularLatencia();
  const reloj = obtenerAlmacen().relojes.find((r) => r.id === idReloj);
  return reloj ? conPedidos(reloj) : null;
}

/** Todas las marcas, para elegir una existente al crear un reloj (REQ-ADM-12). */
export async function listarMarcasAdmin(): Promise<Marca[]> {
  await requerirSesion();
  await simularLatencia();
  return structuredClone(
    obtenerAlmacen().marcas.toSorted((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  );
}

function resolverMarca(datos: DatosReloj): Marca | null {
  const { marcas } = obtenerAlmacen();
  if (datos.idMarca !== null) return marcas.find((m) => m.id === datos.idMarca) ?? null;

  const nombre = datos.marcaNueva?.trim();
  if (!nombre) return null;
  const existente = marcas.find((m) => m.nombre.toLowerCase() === nombre.toLowerCase());
  if (existente) return existente;

  const nueva = { id: marcas.reduce((max, m) => Math.max(max, m.id), 0) + 1, nombre };
  marcas.push(nueva);
  return nueva;
}

function armarImagenes(fotos: string[]) {
  const { relojes } = obtenerAlmacen();
  let siguiente = relojes.flatMap((r) => r.imagenes).reduce((max, i) => Math.max(max, i.id), 0) + 1;
  return fotos.map((archivo, i) => ({
    id: siguiente++,
    archivo,
    orden: i + 1,
    esPrincipal: i === 0,
  }));
}

function validar(datos: DatosReloj): Resultado<DatosReloj> {
  const validacion = esquemaDatosReloj.safeParse(datos);
  if (!validacion.success) {
    return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: validacion.error.issues[0].message };
  }
  const limpios = validacion.data;
  if (limpios.idMarca === null && !limpios.marcaNueva) {
    return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: "Elige una marca." };
  }
  return { ok: true, dato: limpios };
}

/** Agrega un reloj. Si está visible, se publica de inmediato (CU-13). */
export async function crearReloj(datos: DatosReloj): Promise<Resultado<RelojAdmin>> {
  await requerirSesion();
  await simularLatencia(300);

  const validado = validar(datos);
  if (!validado.ok) return validado;
  const limpios = validado.dato;
  const marca = resolverMarca(limpios);
  if (!marca) return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: "Elige una marca." };

  const { relojes } = obtenerAlmacen();
  const ahora = new Date().toISOString();
  const reloj: Reloj = {
    id: relojes.reduce((max, r) => Math.max(max, r.id), 0) + 1,
    marca,
    nombre: limpios.nombre,
    genero: limpios.genero,
    precioCop: limpios.precioCop,
    cantidad: limpios.modo === "DISPONIBLE" ? limpios.cantidad : null,
    garantia: limpios.garantia,
    detalleMecanica: limpios.detalleMecanica || null,
    descripcion: limpios.descripcion || null,
    modo: limpios.modo,
    visible: limpios.visible,
    plazoEstimado: limpios.modo === "BAJO_PEDIDO" ? limpios.plazoEstimado || null : null,
    urlAmigable: urlUnica(
      `${marca.nombre} ${limpios.nombre}`,
      relojes.map((r) => r.urlAmigable),
    ),
    imagenes: armarImagenes(limpios.fotos),
    fechaPublicacion: ahora,
    fechaActualizacion: ahora,
  };
  relojes.push(reloj);
  return { ok: true, dato: conPedidos(reloj) };
}

/**
 * Modifica un reloj. Los pedidos ya registrados no cambian, porque guardan su
 * propia copia del nombre y el precio (SEF-3). La URL se mantiene estable.
 */
export async function actualizarReloj(
  idReloj: number,
  datos: DatosReloj,
): Promise<Resultado<RelojAdmin>> {
  await requerirSesion();
  await simularLatencia(300);

  const reloj = obtenerAlmacen().relojes.find((r) => r.id === idReloj);
  if (!reloj) return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "No encontramos ese reloj." };

  const validado = validar(datos);
  if (!validado.ok) return validado;
  const limpios = validado.dato;
  const marca = resolverMarca(limpios);
  if (!marca) return { ok: false, codigo: "DATOS_INVALIDOS", mensaje: "Elige una marca." };

  Object.assign(reloj, {
    marca,
    nombre: limpios.nombre,
    genero: limpios.genero,
    precioCop: limpios.precioCop,
    cantidad: limpios.modo === "DISPONIBLE" ? limpios.cantidad : null,
    garantia: limpios.garantia,
    detalleMecanica: limpios.detalleMecanica || null,
    descripcion: limpios.descripcion || null,
    modo: limpios.modo,
    visible: limpios.visible,
    plazoEstimado: limpios.modo === "BAJO_PEDIDO" ? limpios.plazoEstimado || null : null,
    imagenes: armarImagenes(limpios.fotos),
    fechaActualizacion: new Date().toISOString(),
  } satisfies Partial<Reloj>);
  return { ok: true, dato: conPedidos(reloj) };
}

/** Cambia el modo sin abrir el formulario (CU-15, REQ-ADM-6). */
export async function cambiarModoReloj(
  idReloj: number,
  modo: ModoReloj,
): Promise<Resultado<RelojAdmin>> {
  await requerirSesion();
  await simularLatencia(200);

  const reloj = obtenerAlmacen().relojes.find((r) => r.id === idReloj);
  if (!reloj) return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "No encontramos ese reloj." };

  reloj.modo = modo;
  // La cantidad solo aplica a Disponible y el plazo solo a Bajo pedido (TBD-2, TBD-7).
  reloj.cantidad = modo === "DISPONIBLE" ? (reloj.cantidad ?? 1) : null;
  if (modo === "DISPONIBLE") reloj.plazoEstimado = null;
  reloj.fechaActualizacion = new Date().toISOString();
  return { ok: true, dato: conPedidos(reloj) };
}

/** Oculta o muestra un reloj sin borrarlo (CU-16, REQ-ADM-7). */
export async function cambiarVisibilidadReloj(
  idReloj: number,
  visible: boolean,
): Promise<Resultado<RelojAdmin>> {
  await requerirSesion();
  await simularLatencia(200);

  const reloj = obtenerAlmacen().relojes.find((r) => r.id === idReloj);
  if (!reloj) return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "No encontramos ese reloj." };

  reloj.visible = visible;
  reloj.fechaActualizacion = new Date().toISOString();
  return { ok: true, dato: conPedidos(reloj) };
}

/** Elimina un reloj solo si no tiene pedidos asociados (CU-17, RN-8, REQ-ADM-8). */
export async function eliminarReloj(idReloj: number): Promise<Resultado<null>> {
  await requerirSesion();
  await simularLatencia(250);

  const almacen = obtenerAlmacen();
  const posicion = almacen.relojes.findIndex((r) => r.id === idReloj);
  if (posicion === -1) {
    return { ok: false, codigo: "NO_ENCONTRADO", mensaje: "No encontramos ese reloj." };
  }
  if (almacen.pedidos.some((p) => p.idReloj === idReloj)) {
    return {
      ok: false,
      codigo: "TIENE_PEDIDOS",
      mensaje: "Este reloj tiene pedidos asociados y no se puede eliminar. Puedes ocultarlo.",
    };
  }
  almacen.relojes.splice(posicion, 1);
  return { ok: true, dato: null };
}
