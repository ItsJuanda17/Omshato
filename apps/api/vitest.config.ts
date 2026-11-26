import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    root: "./",
    include: ["src/**/*.spec.ts"],
    env: {
      NODE_ENV: "test",
      ALMACENAMIENTO_RUTA: "./.tmp/almacenamiento-pruebas",
      LIMITE_SOLICITUDES: "apagado",
      DATABASE_URL: "postgres://omshato:omshato@localhost:5432/omshato_test",
    },
  },
});
