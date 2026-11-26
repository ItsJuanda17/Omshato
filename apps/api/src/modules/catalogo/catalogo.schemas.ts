import { z } from "zod";

/** El id que viaja en la ruta: `/admin/relojes/12`. */
export const esquemaId = z.coerce.number().int().positive();
