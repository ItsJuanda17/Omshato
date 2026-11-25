import { join } from "node:path";

import type { DataSourceOptions } from "typeorm";

/**
 * Opciones de TypeORM compartidas por el API y por la CLI de migraciones
 * (`data-source.ts`). El esquema lo manejan las migraciones, nunca `synchronize`.
 *
 * Las migraciones y las entidades se buscan junto a este archivo, así que
 * funcionan igual desde `src` (CLI con tsx) y desde `dist` (API compilado).
 * Como tsx no emite metadatos de decoradores, cada columna declara su tipo.
 */
export const opcionesBase = {
  type: "postgres",
  synchronize: false,
  migrations: [join(import.meta.dirname, "migrations/*.{ts,js}")],
  entities: [join(import.meta.dirname, "../modules/**/*.entity.{ts,js}")],
} satisfies DataSourceOptions;
