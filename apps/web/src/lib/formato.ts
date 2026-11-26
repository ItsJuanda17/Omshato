const formatoPesos = new Intl.NumberFormat("es-CO", {
  style: "decimal",
  maximumFractionDigits: 0,
});

/** "$3.450.000" (la moneda "COP" se rotula aparte para poder darle otro estilo). */
export function formatoCOP(valor: number) {
  return `$${formatoPesos.format(valor)}`;
}

/** Minúsculas y sin tildes, para comparar textos de búsqueda. */
export function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

/** "Orient Star" pasa a "orient-star". Sirve para URL legibles. */
export function slugificar(texto: string) {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const formatoFechaHoraBogota = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "America/Bogota",
});

/** "23 nov 2026, 14:32", en hora de Colombia. */
export function formatoFechaHora(iso: string) {
  return formatoFechaHoraBogota.format(new Date(iso)).replace(/ de /g, " ").replace(".", "");
}
