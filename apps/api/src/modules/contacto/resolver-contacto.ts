import type { TipoEnlace } from "./tipo-enlace.js";

/** Lo mínimo de un enlace para resolver el contacto público. */
export interface EnlaceGuardado {
  tipo: TipoEnlace;
  valor: string;
  activo: boolean;
}

export interface ContactoPublico {
  whatsapp: { numero: string; visible: string } | null;
  instagram: { url: string; usuario: string } | null;
  tiktok: { url: string; usuario: string } | null;
}

/**
 * Deja solo los dígitos y agrega el indicativo de Colombia a un celular de 10.
 * Devuelve nulo si no parece un número de teléfono (TBD-21: formato por confirmar).
 */
export function normalizarWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 10) {
    return `57${digitos}`;
  }
  return digitos.length >= 11 && digitos.length <= 15 ? digitos : null;
}

/** "573001234567" pasa a "+57 300 123 4567". */
function telefonoVisible(numero: string) {
  const colombiano = /^57(\d{3})(\d{3})(\d{4})$/.exec(numero);
  return colombiano ? `+57 ${colombiano[1]} ${colombiano[2]} ${colombiano[3]}` : `+${numero}`;
}

/** El nombre de usuario sale del último tramo de la dirección del perfil. */
function usuarioDePerfil(url: string) {
  const tramo = url.split("?")[0].split("/").filter(Boolean).pop() ?? url;
  return tramo.replace(/^@/, "");
}

/**
 * Convierte los enlaces guardados en lo que muestra el sitio público. Un tipo sin enlace
 * activo y con valor llega como nulo, y el sitio no muestra su icono (REQ-CON-4).
 */
export function resolverContacto(enlaces: EnlaceGuardado[]): ContactoPublico {
  const activo = (tipo: TipoEnlace) =>
    enlaces.find((e) => e.tipo === tipo && e.activo && e.valor.trim() !== "")?.valor.trim() ?? null;

  const whatsapp = activo("WHATSAPP");
  const numero = whatsapp ? normalizarWhatsapp(whatsapp) : null;
  const instagram = activo("INSTAGRAM");
  const tiktok = activo("TIKTOK");

  return {
    whatsapp: numero ? { numero, visible: telefonoVisible(numero) } : null,
    instagram: instagram ? { url: instagram, usuario: usuarioDePerfil(instagram) } : null,
    tiktok: tiktok ? { url: tiktok, usuario: usuarioDePerfil(tiktok) } : null,
  };
}
