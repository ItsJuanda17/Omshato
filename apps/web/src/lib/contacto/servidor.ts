import { cache } from "react";

import { obtenerContactoPublico } from "@/lib/api/enlaces";

/** Contacto público de la solicitud en curso. Varios componentes lo piden y se consulta una vez. */
export const contactoPublico = cache(obtenerContactoPublico);
