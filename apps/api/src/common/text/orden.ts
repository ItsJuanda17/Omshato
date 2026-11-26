const colacion = new Intl.Collator("es");

/**
 * Compara dos textos como se ordenan en español: "Córdoba" va antes de "Cundinamarca".
 * Se ordena aquí y no en la base de datos porque su colación por defecto manda las tildes al final.
 */
export function compararNombres(a: { nombre: string }, b: { nombre: string }) {
  return colacion.compare(a.nombre, b.nombre);
}
