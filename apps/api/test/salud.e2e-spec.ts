import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types.js";

import { crearAppSinBaseDeDatos } from "./ayudantes/crear-app.js";

describe("API (e2e)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await crearAppSinBaseDeDatos();
  });

  afterAll(async () => {
    await app.close();
  });

  it("GET /api/salud responde que está vivo", async () => {
    const respuesta = await request(app.getHttpServer()).get("/api/salud").expect(200);

    expect(respuesta.body).toEqual({ estado: "ok" });
  });

  it("una ruta inexistente responde con el formato uniforme de error", async () => {
    const respuesta = await request(app.getHttpServer()).get("/api/no-existe").expect(404);

    expect(respuesta.body).toMatchObject({
      estado: 404,
      codigo: "NO_ENCONTRADO",
      ruta: "/api/no-existe",
    });
    expect(typeof respuesta.body.mensaje).toBe("string");
    expect(typeof respuesta.body.fecha).toBe("string");
  });

  it("envía los encabezados de seguridad de helmet", async () => {
    const respuesta = await request(app.getHttpServer()).get("/api/salud");

    expect(respuesta.headers["x-content-type-options"]).toBe("nosniff");
    expect(respuesta.headers["x-powered-by"]).toBeUndefined();
  });

  it("permite con credenciales solo el origen del front configurado", async () => {
    const permitido = await request(app.getHttpServer())
      .get("/api/salud")
      .set("Origin", "http://localhost:3000");
    const ajeno = await request(app.getHttpServer())
      .get("/api/salud")
      .set("Origin", "https://otro-sitio.com");

    expect(permitido.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(permitido.headers["access-control-allow-credentials"]).toBe("true");
    // El API nunca devuelve el origen ajeno, así que el navegador bloquea esa lectura.
    expect(ajeno.headers["access-control-allow-origin"]).not.toBe("https://otro-sitio.com");
  });
});
