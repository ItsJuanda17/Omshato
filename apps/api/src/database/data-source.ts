import { DataSource } from "typeorm";

import { opcionesBase } from "./opciones.js";

/**
 * Fuente de datos para la CLI de TypeORM (`pnpm migration:run`, etc.).
 * El API en marcha usa `DatabaseModule`, que parte de las mismas opciones.
 */
export default new DataSource({
  ...opcionesBase,
  url: process.env.DATABASE_URL,
});
