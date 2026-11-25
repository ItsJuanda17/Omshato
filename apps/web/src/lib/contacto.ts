import { contacto } from "@/config/contacto";

/**
 * Enlace de chat directo de WhatsApp (sin API). Si viene de una ficha,
 * lleva un mensaje que nombra el reloj (REQ-CON-2).
 */
export function enlaceWhatsApp(nombreReloj?: string) {
  const mensaje = nombreReloj
    ? `Hola, me interesa el reloj ${nombreReloj}`
    : "Hola, quiero más información sobre sus relojes";
  return `https://wa.me/${contacto.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;
}
