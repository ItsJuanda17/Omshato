import type { ModoReloj } from "@omshato/contratos";

/**
 * Relojes de demostración para ver el sitio con contenido. Las fotos son ilustraciones
 * provisionales (`apps/api/demo/fotos`): cada reloj usa una frontal según su esfera, el
 * fondo de la caja y un detalle.
 */
export interface RelojDemo {
  marca: string;
  nombre: string;
  genero: "Hombre" | "Mujer" | "Unisex";
  precioCop: number;
  modo: ModoReloj;
  visible: boolean;
  esfera: 1 | 2 | 3 | 4;
  cantidad?: number;
  plazoEstimado?: string;
  /** Una línea por dato, con el formato "Clave: valor" (TBD-6). */
  mecanica: string[];
  descripcion: string;
}

/** Del más antiguo al más reciente: así el catálogo, que ordena por publicación, queda como se espera. */
export const RELOJES_DEMO: RelojDemo[] = [
  {
    marca: "Citizen",
    nombre: "Promaster Dive Automatic",
    genero: "Hombre",
    precioCop: 3_990_000,
    modo: "DISPONIBLE",
    visible: false,
    esfera: 4,
    cantidad: 1,
    mecanica: ["Calibre: 8203, automático", "Hermeticidad: 20 bar (200 m)", "Material: Acero"],
    descripcion: "Reloj de buceo retirado temporalmente del catálogo.",
  },
  {
    marca: "Oris",
    nombre: "Aquis Date Calibre 400",
    genero: "Hombre",
    precioCop: 12_100_000,
    modo: "BAJO_PEDIDO",
    visible: false,
    esfera: 1,
    plazoEstimado: "15 a 20 días hábiles",
    mecanica: ["Calibre: 400, automático", "Reserva de marcha: 120 horas", "Cristal: Zafiro"],
    descripcion: "Buceo de manufactura con cinco días de reserva de marcha.",
  },
  {
    marca: "Tissot",
    nombre: "Gentleman Powermatic 80 Silicium",
    genero: "Hombre",
    precioCop: 4_150_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 2,
    cantidad: 1,
    mecanica: [
      "Calibre: Powermatic 80.111, automático",
      "Reserva de marcha: 80 horas",
      "Diámetro de caja: 40 mm",
      "Cristal: Zafiro",
    ],
    descripcion: "Espiral de silicio antimagnético y líneas sobrias para el uso diario.",
  },
  {
    marca: "Longines",
    nombre: "HydroConquest 41 mm",
    genero: "Hombre",
    precioCop: 7_950_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 1,
    cantidad: 1,
    mecanica: [
      "Calibre: L888.5, automático",
      "Reserva de marcha: 64 horas",
      "Diámetro de caja: 41 mm",
      "Hermeticidad: 30 bar (300 m)",
    ],
    descripcion: "Buceo elegante con bisel cerámico y brazalete de acero.",
  },
  {
    marca: "Casio",
    nombre: "G-Shock GA-2100",
    genero: "Unisex",
    precioCop: 780_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 3,
    cantidad: 3,
    mecanica: ["Movimiento: Cuarzo", "Resistencia a golpes: Sí", "Hermeticidad: 20 bar (200 m)"],
    descripcion: "Caja de carbono delgada, resistente a los golpes y fácil de usar a diario.",
  },
  {
    marca: "Orient Star",
    nombre: "Heritage Skeleton",
    genero: "Hombre",
    precioCop: 3_890_000,
    modo: "BAJO_PEDIDO",
    visible: true,
    esfera: 4,
    plazoEstimado: "10 a 15 días hábiles",
    mecanica: [
      "Calibre: F6F44, manufactura, automático",
      "Reserva de marcha: 50 horas",
      "Diámetro de caja: 41 mm",
      "Cristal: Zafiro",
    ],
    descripcion: "Esfera esqueletizada que deja ver el movimiento de manufactura.",
  },
  {
    marca: "Seiko",
    nombre: "5 Sports Suit Style",
    genero: "Hombre",
    precioCop: 1_380_000,
    modo: "DISPONIBLE",
    visible: true,
    esfera: 2,
    cantidad: 1,
    mecanica: [
      "Calibre: 4R36, automático",
      "Reserva de marcha: 41 horas",
      "Diámetro de caja: 40,2 mm",
      "Cristal: Hardlex",
    ],
    descripcion: "Un clásico versátil, igual de cómodo con traje que con ropa informal.",
  },
  {
    marca: "Tissot",
    nombre: "PRX Powermatic 80",
    genero: "Hombre",
    precioCop: 3_450_000,
    modo: "BAJO_PEDIDO",
    visible: true,
    esfera: 1,
    plazoEstimado: "8 a 12 días hábiles",
    mecanica: [
      "Calibre: Powermatic 80.111, automático",
      "Reserva de marcha: 80 horas",
      "Diámetro de caja: 40 mm",
      "Hermeticidad: 10 bar (100 m)",
      "Material: Acero inoxidable 316L",
    ],
    descripcion:
      "Un diseño de finales de los setenta con brazalete integrado y esfera texturizada. El espiral Nivachron protege el calibre de los campos magnéticos.",
  },
];
