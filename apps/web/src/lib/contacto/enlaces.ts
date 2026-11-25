import type { ContactoPublico, EnlaceContacto } from "@/lib/api/tipos";

const MENSAJE_GENERICO = "Hola, quiero más información sobre sus relojes";

/** Mensaje de consulta desde la ficha de un reloj (REQ-CON-2). */
export function mensajeConsultaReloj(nombreReloj: string) {
  return `Hola, me interesa el reloj ${nombreReloj}`;
}

/**
 * Deja solo los dígitos y agrega el indicativo de Colombia a un celular de 10.
 * Devuelve nulo si no parece un número de teléfono (TBD-21: formato por confirmar).
 */
export function normalizarWhatsapp(valor: string) {
  const digitos = valor.replace(/\D/g, "");
  if (digitos.length === 10) return `57${digitos}`;
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

/** Convierte los enlaces guardados en lo que muestra el sitio público. */
export function resolverContacto(enlaces: EnlaceContacto[]): ContactoPublico {
  const activo = (tipo: EnlaceContacto["tipo"]) =>
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

/** Enlace de chat directo con el negocio, sin API. Nulo si WhatsApp no está configurado. */
export function enlaceWhatsApp(
  whatsapp: ContactoPublico["whatsapp"],
  mensaje: string = MENSAJE_GENERICO,
) {
  return whatsapp ? `https://wa.me/${whatsapp.numero}?text=${encodeURIComponent(mensaje)}` : null;
}

/** Chat con un comprador a partir de su celular de 10 dígitos (REQ-GPE-10). */
export function enlaceWhatsAppComprador(celular: string, mensaje: string) {
  return `https://wa.me/57${celular}?text=${encodeURIComponent(mensaje)}`;
}
