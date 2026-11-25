import { contacto } from "@/config/contacto";

const MENSAJE_GENERICO = "Hola, quiero más información sobre sus relojes";

/** Mensaje de consulta desde la ficha de un reloj (REQ-CON-2). */
export function mensajeConsultaReloj(nombreReloj: string) {
  return `Hola, me interesa el reloj ${nombreReloj}`;
}

/** Enlace de chat directo de WhatsApp, sin API. */
export function enlaceWhatsApp(mensaje: string = MENSAJE_GENERICO) {
  return `https://wa.me/${contacto.whatsapp.numero}?text=${encodeURIComponent(mensaje)}`;
}
