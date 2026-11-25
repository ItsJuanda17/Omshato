import { join } from "node:path";

import type { DataSourceOptions } from "typeorm";

import { EstrategiaNombresSnake } from "./estrategia-nombres.js";

/**
 * Opciones de TypeORM compartidas por el API y por la CLI de migraciones
 * (`data-source.ts`). El esquema lo manejan las migraciones, nunca `synchronize`.
 *
 * Las migraciones se buscan junto a este archivo, así que funcionan igual desde
 * `src` (CLI con tsx) y desde `dist` (API compilado). Las entidades no se listan
 * aquí: cada módulo registra las suyas con `TypeOrmModule.forFeature`.
 */
export const opcionesBase = {
  type: "postgres",
  synchronize: false,
  namingStrategy: new EstrategiaNombresSnake(),
  migrations: [join(import.meta.dirname, "migrations/*.{ts,js}")],
} satisfies DataSourceOptions;
