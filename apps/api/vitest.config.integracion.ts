import { defineConfig } from "vitest/config";

/**
 * Pruebas de integración: usan PostgreSQL de verdad (`pnpm db:up`), en la base
 * `omshato_test`, que reinician en cada corrida. Nunca tocan la base de desarrollo.
 */
export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["test/integracion/**/*.int-spec.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      NODE_ENV: "test",
      ALMACENAMIENTO_RUTA: "./.tmp/almacenamiento-pruebas",
      LIMITE_SOLICITUDES: "apagado",
      DATABASE_URL: "postgres://omshato:omshato@localhost:5432/omshato_test",
    },
  },
});
