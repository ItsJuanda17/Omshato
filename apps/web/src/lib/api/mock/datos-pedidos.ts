import { contactoInicial } from "@/config/contacto";
import { ciudadesEjemplo, departamentosEjemplo } from "@/lib/api/datos-colombia";
import { relojesEjemplo } from "@/lib/api/datos-ejemplo";
import type { EnlaceContacto, EstadoPedido, Pedido } from "@/lib/api/tipos";

/** Administrador de ejemplo. Es el autor de los cambios de estado y de las notas. */
export const ID_ADMINISTRADOR_EJEMPLO = 1;

interface DatosPedido {
  numero: number;
  idReloj: number;
  comprador: string;
  celular: string;
  idCiudad: number;
  direccion: string;
  /** Cada paso es [estado, "día de noviembre", "hora"]. El primero es el estado inicial. */
  pasos: [EstadoPedido, number, string][];
  motivoCancelacion?: string;
  notas?: [string, number, string][];
}

const fecha = (dia: number, hora: string) =>
  `2026-11-${String(dia).padStart(2, "0")}T${hora}:00.000-05:00`;

function pedido(d: DatosPedido): Pedido {
  const reloj = relojesEjemplo.find((r) => r.id === d.idReloj);
  const ciudad = ciudadesEjemplo.find((c) => c.id === d.idCiudad);
  const departamento = departamentosEjemplo.find((x) => x.id === ciudad?.idDepartamento);
  if (!reloj || !ciudad || !departamento) throw new Error(`Pedido de ejemplo inválido: ${d.numero}`);

  const historial = d.pasos.map(([estado, dia, hora], i) => ({
    id: i + 1,
    estado,
    // El primer estado lo registra el sistema al recibir el pedido.
    idAdministrador: i === 0 ? null : ID_ADMINISTRADOR_EJEMPLO,
    fechaHora: fecha(dia, hora),
  }));
  const creado = historial[0].fechaHora;

  return {
    id: d.numero,
    numeroPedido: `OMS-${String(d.numero).padStart(4, "0")}`,
    idReloj: reloj.id,
    estado: historial[historial.length - 1].estado,
    departamento,
    ciudad,
    nombreReloj: `${reloj.marca.nombre} ${reloj.nombre}`,
    precioReloj: reloj.precioCop,
    modoReloj: reloj.modo,
    nombreComprador: d.comprador,
    telefonoComprador: d.celular,
    direccion: d.direccion,
    fechaAutorizacionDatos: creado,
    motivoCancelacion: d.motivoCancelacion ?? null,
    fechaCreacion: creado,
    historial,
    notas: (d.notas ?? []).map(([texto, dia, hora], i) => ({
      id: d.numero * 10 + i + 1,
      idAdministrador: ID_ADMINISTRADOR_EJEMPLO,
      texto,
      fechaHora: fecha(dia, hora),
    })),
  };
}

export const pedidosEjemplo: Pedido[] = [
  pedido({
    numero: 842,
    idReloj: 1,
    comprador: "Santiago Montoya Gaviria",
    celular: "3001112233",
    idCiudad: 5001,
    direccion: "Carrera 35 # 7-82, torre empresarial, oficina 904",
    pasos: [["POR_CONSEGUIR_CON_PROVEEDOR", 23, "14:32"]],
    notas: [["Consultado el proveedor. Plazo acordado: 8 días hábiles.", 23, "15:45"]],
  }),
  pedido({
    numero: 841,
    idReloj: 2,
    comprador: "Valeria Echeverry Restrepo",
    celular: "3012223344",
    idCiudad: 11001,
    direccion: "Calle 85 # 15-20, apartamento 502",
    pasos: [
      ["RECIBIDO", 23, "11:15"],
      ["CONFIRMADO", 23, "12:30"],
    ],
  }),
  pedido({
    numero: 840,
    idReloj: 7,
    comprador: "Daniela Rojas Cárdenas",
    celular: "3023334455",
    idCiudad: 13001,
    direccion: "Barrio Manga, calle 25 # 20-31",
    pasos: [["RECIBIDO", 22, "19:40"]],
  }),
  pedido({
    numero: 839,
    idReloj: 3,
    comprador: "Camilo Arboleda Henao",
    celular: "3034445566",
    idCiudad: 76001,
    direccion: "Avenida 6N # 25-40, casa 3",
    pasos: [
      ["POR_CONSEGUIR_CON_PROVEEDOR", 20, "18:04"],
      ["CONFIRMADO", 21, "10:00"],
      ["ENVIADO", 22, "09:30"],
    ],
  }),
  pedido({
    numero: 838,
    idReloj: 8,
    comprador: "Mauricio Zuluaga Peña",
    celular: "3045556677",
    idCiudad: 8001,
    direccion: "Carrera 53 # 76-10",
    pasos: [
      ["RECIBIDO", 15, "16:45"],
      ["CONFIRMADO", 16, "09:00"],
      ["ENVIADO", 17, "11:20"],
      ["ENTREGADO", 19, "14:10"],
    ],
  }),
  pedido({
    numero: 836,
    idReloj: 4,
    comprador: "Felipe Gómez Villegas",
    celular: "3056667788",
    idCiudad: 68001,
    direccion: "Calle 36 # 27-15, apartamento 1201",
    pasos: [["RECIBIDO", 22, "09:12"]],
  }),
  pedido({
    numero: 835,
    idReloj: 6,
    comprador: "Laura Ospina Marín",
    celular: "3067778899",
    idCiudad: 66001,
    direccion: "Carrera 7 # 19-30",
    pasos: [["POR_CONSEGUIR_CON_PROVEEDOR", 21, "16:20"]],
  }),
  pedido({
    numero: 829,
    idReloj: 10,
    comprador: "Andrés Felipe Castro Díaz",
    celular: "3078889900",
    idCiudad: 66001,
    direccion: "Avenida Circunvalar # 8-45",
    pasos: [
      ["RECIBIDO", 12, "17:50"],
      ["CANCELADO", 13, "10:15"],
    ],
    motivoCancelacion: "El comprador desistió de la compra.",
  }),
];

export const enlacesEjemplo: EnlaceContacto[] = [
  { id: 1, tipo: "WHATSAPP", valor: contactoInicial.whatsapp, activo: true },
  { id: 2, tipo: "INSTAGRAM", valor: contactoInicial.instagram, activo: true },
  { id: 3, tipo: "TIKTOK", valor: contactoInicial.tiktok, activo: true },
];
