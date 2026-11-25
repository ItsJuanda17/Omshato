/**
 * Datos de contacto del negocio. Es el único lugar donde viven.
 *
 * VALORES PROVISIONALES: el formato del teléfono está pendiente de confirmar con
 * el cliente (TBD-10 y TBD-21 del SRS). Cuando el cliente lo confirme, solo hay
 * que cambiar este archivo. Si un valor queda vacío, el sitio no muestra su
 * enlace (REQ-CON-4).
 */
export const contacto = {
  whatsapp: {
    /** Solo dígitos, con indicativo de país, como lo pide wa.me. */
    numero: "573000000000",
    /** Cómo se muestra el número en pantalla. */
    visible: "+57 300 000 0000",
  },
  instagram: {
    usuario: "omsha_to",
    url: "https://www.instagram.com/omsha_to",
  },
  tiktok: {
    usuario: "omsha_to",
    url: "https://www.tiktok.com/@omsha_to",
  },
} as const;
