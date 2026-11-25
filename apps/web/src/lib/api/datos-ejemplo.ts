import type { ImagenReloj, Marca, ModoReloj, Reloj } from "@/lib/api/tipos";

/**
 * Datos de ejemplo en memoria. Se reemplazan cuando exista la API real.
 * Las fotos son ilustraciones provisionales en public/relojes.
 */

export const marcasEjemplo: Marca[] = [
  { id: 1, nombre: "Tissot" },
  { id: 2, nombre: "Seiko" },
  { id: 3, nombre: "Hamilton" },
  { id: 4, nombre: "Citizen" },
  { id: 5, nombre: "Orient Star" },
  { id: 6, nombre: "Casio" },
  { id: 7, nombre: "Longines" },
  { id: 8, nombre: "Mido" },
  { id: 9, nombre: "Oris" },
];

function marca(id: number) {
  const encontrada = marcasEjemplo.find((m) => m.id === id);
  if (!encontrada) throw new Error(`Marca de ejemplo inexistente: ${id}`);
  return encontrada;
}

/** Tres fotos por reloj: una frontal (según el modelo de esfera), el fondo y un detalle. */
function fotos(idReloj: number, esfera: 1 | 2 | 3 | 4): ImagenReloj[] {
  return [`frontal-${esfera}`, "reverso", "detalle"].map((nombre, i) => ({
    id: idReloj * 10 + i + 1,
    archivo: `/relojes/${nombre}.svg`,
    orden: i + 1,
    esPrincipal: i === 0,
  }));
}

interface DatosReloj {
  id: number;
  marca: number;
  nombre: string;
  genero: string;
  precioCop: number;
  modo: ModoReloj;
  visible: boolean;
  esfera: 1 | 2 | 3 | 4;
  urlAmigable: string;
  publicado: string;
  mecanica: string[];
  descripcion: string;
  plazoEstimado?: string;
  cantidad?: number;
}

function reloj(d: DatosReloj): Reloj {
  return {
    id: d.id,
    marca: marca(d.marca),
    nombre: d.nombre,
    genero: d.genero,
    precioCop: d.precioCop,
    cantidad: d.modo === "DISPONIBLE" ? (d.cantidad ?? 1) : null,
    garantia: "12 meses de garantía con Omshato",
    detalleMecanica: d.mecanica.join("\n"),
    descripcion: d.descripcion,
    modo: d.modo,
    visible: d.visible,
    plazoEstimado: d.modo === "BAJO_PEDIDO" ? (d.plazoEstimado ?? "8 a 15 días hábiles") : null,
    urlAmigable: d.urlAmigable,
    imagenes: fotos(d.id, d.esfera),
    fechaPublicacion: `${d.publicado}T15:00:00.000-05:00`,
    fechaActualizacion: `${d.publicado}T15:00:00.000-05:00`,
  };
}

export const relojesEjemplo: Reloj[] = [
  reloj({
    id: 1,
    marca: 1,
    nombre: "PRX Powermatic 80",
    genero: "Hombre",
    precioCop: 3_450_000,
    modo: "BAJO_PEDIDO",
    visible: true,
    esfera: 1,
    urlAmigable: "tissot-prx-powermatic-80",
    publicado: "2026-11-20",
    plazoEstimado: "8 a 12 días hábiles",
    mecanica: [
      "Calibre: Powermatic 80.111, automático",
      "Reserva de marcha: 80 horas",
      "Diámetro de caja: 40 mm",
      "Grosor: 10,9 mm",
      "Cristal: Zafiro con tratamiento antirreflejos",
      "Hermeticidad: 10 bar (100 m)",
      "Material: Acero inoxidable 316L",
    ],
    descripcion:
      "Un diseño de finales de los setenta con brazalete integrado y esfera texturizada. El espiral Nivachron protege el calibre de los campos magnéticos.",
  }),
  reloj({
    id: 2,
    marca: 2,
    nombre: "Prospex Diver 200M",
    genero: "Hombre",
    precioCop: 5_890_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 3,
    urlAmigable: "seiko-prospex-diver-200m",
    publicado: "2026-11-18",
    mecanica: [
      "Calibre: 6R35, automático",
      "Reserva de marcha: 70 horas",
      "Diámetro de caja: 42 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 20 bar (200 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Reloj de buceo con bisel unidireccional y corona atornillada.",
  }),
  reloj({
    id: 3,
    marca: 3,
    nombre: "Khaki Field Mechanical",
    genero: "Hombre",
    precioCop: 2_980_000,
    modo: "BAJO_PEDIDO",
    visible: true,
    esfera: 2,
    urlAmigable: "hamilton-khaki-field-mechanical",
    publicado: "2026-11-15",
    mecanica: [
      "Calibre: H-50, cuerda manual",
      "Reserva de marcha: 80 horas",
      "Diámetro de caja: 38 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 5 bar (50 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Diseño militar clásico de cuerda manual, con esfera clara de lectura inmediata.",
  }),
  reloj({
    id: 4,
    marca: 4,
    nombre: "Tsuyosa Automatic",
    genero: "Unisex",
    precioCop: 1_690_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 1,
    urlAmigable: "citizen-tsuyosa-automatic",
    publicado: "2026-11-12",
    cantidad: 2,
    mecanica: [
      "Calibre: 8210, automático",
      "Reserva de marcha: 40 horas",
      "Diámetro de caja: 40 mm",
      "Cristal: Mineral",
      "Hermeticidad: 5 bar (50 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Brazalete integrado y calibre automático a un precio de entrada.",
  }),
  reloj({
    id: 5,
    marca: 2,
    nombre: "5 Sports Suit Style",
    genero: "Hombre",
    precioCop: 1_380_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 2,
    urlAmigable: "seiko-5-sports-suit-style",
    publicado: "2026-11-09",
    mecanica: [
      "Calibre: 4R36, automático",
      "Reserva de marcha: 41 horas",
      "Diámetro de caja: 40,2 mm",
      "Cristal: Hardlex",
      "Hermeticidad: 10 bar (100 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Un clásico versátil, igual de cómodo con traje que con ropa informal.",
  }),
  reloj({
    id: 6,
    marca: 5,
    nombre: "Heritage Skeleton",
    genero: "Hombre",
    precioCop: 3_890_000,
    modo: "BAJO_PEDIDO",
    visible: true,
    esfera: 4,
    urlAmigable: "orient-star-heritage-skeleton",
    publicado: "2026-11-06",
    plazoEstimado: "10 a 15 días hábiles",
    mecanica: [
      "Calibre: F6F44, manufactura, automático",
      "Reserva de marcha: 50 horas",
      "Diámetro de caja: 41 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 10 bar (100 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Esfera esqueletizada que deja ver el movimiento y sus engranajes en acción.",
  }),
  reloj({
    id: 7,
    marca: 6,
    nombre: "G-Shock GA-2100",
    genero: "Unisex",
    precioCop: 780_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 3,
    urlAmigable: "casio-g-shock-ga-2100",
    publicado: "2026-11-03",
    cantidad: 3,
    mecanica: [
      "Movimiento: Cuarzo",
      "Diámetro de caja: 45,4 mm",
      "Cristal: Mineral",
      "Hermeticidad: 20 bar (200 m)",
      "Material: Resina de carbono",
    ],
    descripcion: "Caja de carbono resistente a golpes, en versión monocromática.",
  }),
  reloj({
    id: 8,
    marca: 7,
    nombre: "HydroConquest 41 mm",
    genero: "Hombre",
    precioCop: 7_950_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 1,
    urlAmigable: "longines-hydroconquest-41",
    publicado: "2026-10-29",
    mecanica: [
      "Calibre: L888, automático",
      "Reserva de marcha: 64 horas",
      "Diámetro de caja: 41 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 30 bar (300 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Reloj de buceo elegante con bisel de cerámica.",
  }),
  reloj({
    id: 9,
    marca: 1,
    nombre: "Gentleman Powermatic 80 Silicium",
    genero: "Hombre",
    precioCop: 4_150_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 2,
    urlAmigable: "tissot-gentleman-powermatic-80-silicium",
    publicado: "2026-10-24",
    mecanica: [
      "Calibre: Powermatic 80.811, automático",
      "Reserva de marcha: 80 horas",
      "Diámetro de caja: 40 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 10 bar (100 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Espiral de silicio antimagnético y líneas sobrias para el uso diario.",
  }),
  reloj({
    id: 10,
    marca: 8,
    nombre: "Ocean Star Tribute",
    genero: "Hombre",
    precioCop: 3_980_000,
    modo: "DISPONIBLE",
    visible: false,
    esfera: 3,
    urlAmigable: "mido-ocean-star-tribute",
    publicado: "2026-10-18",
    mecanica: [
      "Calibre: Caliber 80, automático",
      "Reserva de marcha: 80 horas",
      "Diámetro de caja: 40,5 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 20 bar (200 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Homenaje a los relojes de buceo de los años sesenta.",
  }),
  reloj({
    id: 11,
    marca: 9,
    nombre: "Aquis Date Calibre 400",
    genero: "Hombre",
    precioCop: 12_100_000,
    modo: "BAJO_PEDIDO",
    visible: false,
    esfera: 1,
    urlAmigable: "oris-aquis-date-calibre-400",
    publicado: "2026-10-10",
    plazoEstimado: "15 a 20 días hábiles",
    mecanica: [
      "Calibre: 400, automático",
      "Reserva de marcha: 120 horas",
      "Diámetro de caja: 41,5 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 30 bar (300 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Cinco días de reserva de marcha y garantía extendida del fabricante.",
  }),
  reloj({
    id: 12,
    marca: 4,
    nombre: "Promaster Dive Automatic",
    genero: "Hombre",
    precioCop: 3_990_000,
    modo: "DISPONIBLE",
    visible: false,
    esfera: 4,
    urlAmigable: "citizen-promaster-dive-automatic",
    publicado: "2026-10-02",
    mecanica: [
      "Calibre: 9051, automático",
      "Reserva de marcha: 40 horas",
      "Diámetro de caja: 44 mm",
      "Cristal: Zafiro",
      "Hermeticidad: 20 bar (200 m)",
      "Material: Acero inoxidable",
    ],
    descripcion: "Reloj de buceo certificado con corona atornillada.",
  }),
];
