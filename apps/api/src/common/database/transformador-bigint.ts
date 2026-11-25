import type { ValueTransformer } from "typeorm";

/**
 * PostgreSQL entrega los `bigint` como texto para no perder precisión. Los precios
 * en COP son enteros muy por debajo de 2^53, así que se manejan como número.
 */
export const transformadorBigint: ValueTransformer = {
  to: (valor: number | null | undefined) => valor,
  from: (valor: string | null) => (valor === null ? null : Number(valor)),
};
