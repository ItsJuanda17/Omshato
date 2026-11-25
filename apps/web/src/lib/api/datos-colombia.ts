import type { Ciudad, Departamento } from "@/lib/api/tipos";

/**
 * Lista reducida de ejemplo: los 32 departamentos, Bogotá y las ciudades
 * principales de cada uno, con códigos DANE. Se reemplaza por el listado
 * completo (DIVIPOLA) cuando exista la API (REQ-PED-5).
 */

const departamentosBase: [string, string][] = [
  ["05", "Antioquia"],
  ["08", "Atlántico"],
  ["11", "Bogotá D.C."],
  ["13", "Bolívar"],
  ["15", "Boyacá"],
  ["17", "Caldas"],
  ["18", "Caquetá"],
  ["19", "Cauca"],
  ["20", "Cesar"],
  ["23", "Córdoba"],
  ["25", "Cundinamarca"],
  ["27", "Chocó"],
  ["41", "Huila"],
  ["44", "La Guajira"],
  ["47", "Magdalena"],
  ["50", "Meta"],
  ["52", "Nariño"],
  ["54", "Norte de Santander"],
  ["63", "Quindío"],
  ["66", "Risaralda"],
  ["68", "Santander"],
  ["70", "Sucre"],
  ["73", "Tolima"],
  ["76", "Valle del Cauca"],
  ["81", "Arauca"],
  ["85", "Casanare"],
  ["86", "Putumayo"],
  ["88", "San Andrés y Providencia"],
  ["91", "Amazonas"],
  ["94", "Guainía"],
  ["95", "Guaviare"],
  ["97", "Vaupés"],
  ["99", "Vichada"],
];

export const departamentosEjemplo: Departamento[] = departamentosBase.map(
  ([codigoDane, nombre]) => ({ id: Number(codigoDane), codigoDane, nombre }),
);

/** [código DANE del municipio, nombre]. El departamento sale de los dos primeros dígitos. */
const ciudadesBase: [string, string][] = [
  ["05001", "Medellín"],
  ["05088", "Bello"],
  ["05266", "Envigado"],
  ["05360", "Itagüí"],
  ["05615", "Rionegro"],
  ["08001", "Barranquilla"],
  ["08758", "Soledad"],
  ["11001", "Bogotá D.C."],
  ["13001", "Cartagena de Indias"],
  ["15001", "Tunja"],
  ["17001", "Manizales"],
  ["18001", "Florencia"],
  ["19001", "Popayán"],
  ["20001", "Valledupar"],
  ["23001", "Montería"],
  ["25175", "Chía"],
  ["25754", "Soacha"],
  ["25899", "Zipaquirá"],
  ["27001", "Quibdó"],
  ["41001", "Neiva"],
  ["44001", "Riohacha"],
  ["47001", "Santa Marta"],
  ["50001", "Villavicencio"],
  ["52001", "Pasto"],
  ["54001", "Cúcuta"],
  ["63001", "Armenia"],
  ["66001", "Pereira"],
  ["66170", "Dosquebradas"],
  ["68001", "Bucaramanga"],
  ["68276", "Floridablanca"],
  ["68307", "Girón"],
  ["70001", "Sincelejo"],
  ["73001", "Ibagué"],
  ["76001", "Cali"],
  ["76109", "Buenaventura"],
  ["76520", "Palmira"],
  ["81001", "Arauca"],
  ["85001", "Yopal"],
  ["86001", "Mocoa"],
  ["88001", "San Andrés"],
  ["91001", "Leticia"],
  ["94001", "Inírida"],
  ["95001", "San José del Guaviare"],
  ["97001", "Mitú"],
  ["99001", "Puerto Carreño"],
];

export const ciudadesEjemplo: Ciudad[] = ciudadesBase.map(([codigoDane, nombre]) => ({
  id: Number(codigoDane),
  idDepartamento: Number(codigoDane.slice(0, 2)),
  codigoDane,
  nombre,
}));
