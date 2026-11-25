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
