/**
 * Valores iniciales de los enlaces de contacto. Es el único lugar donde viven
 * en el código: el almacén los toma de aquí y, desde el panel, el administrador
 * los edita (REQ-CON-5).
 *
 * VALORES PROVISIONALES: el formato del teléfono está pendiente de confirmar con
 * el cliente (TBD-10 y TBD-21 del SRS). Cuando lo confirme, solo hay que cambiar
 * este archivo. Un valor vacío deja el enlace sin configurar y el sitio no
 * muestra su icono (REQ-CON-4).
 */
export const contactoInicial = {
  /** Con indicativo de país y sin símbolos, como lo pide wa.me. */
  whatsapp: "573000000000",
  instagram: "https://www.instagram.com/omsha_to",
  tiktok: "https://www.tiktok.com/@omsha_to",
} as const;
