import type { ContactoPublico } from "@/lib/api/tipos";

const MENSAJE_GENERICO = "Hola, quiero más información sobre sus relojes";

/** Mensaje de consulta desde la ficha de un reloj (REQ-CON-2). */
export function mensajeConsultaReloj(nombreReloj: string) {
  return `Hola, me interesa el reloj ${nombreReloj}`;
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
