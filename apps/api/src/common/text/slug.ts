/** "Orient Star Ñandú" pasa a "orient-star-nandu". Sirve para URL legibles y estables. */
export function slugificar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
