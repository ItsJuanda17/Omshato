import type { INestApplication } from "@nestjs/common";
import request from "supertest";
import type { App } from "supertest/types.js";

import { crearAppSinBaseDeDatos } from "./ayudantes/crear-app.js";

/**
 * Lo que el guard global decide sin tocar la base de datos: quién entra sin sesión
 * y qué datos llegan al inicio de sesión. El flujo completo está en `test/integracion`.
 */
describe("autenticación (e2e, sin base de datos)", () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await crearAppSinBaseDeDatos();
  });

  afterAll(async () => {
    await app.close();
  });

  it("una ruta protegida sin sesión responde 401 con el formato uniforme (REQ-AUT-1)", async () => {
    const respuesta = await request(app.getHttpServer()).get("/api/auth/yo").expect(401);

    expect(respuesta.body).toMatchObject({
      estado: 401,
      codigo: "NO_AUTENTICADO",
      mensaje: "Inicia sesión para continuar.",
      ruta: "/api/auth/yo",
    });
  });

  it("una cookie de sesión con formato inválido cuenta como no haber iniciado sesión", async () => {
    await request(app.getHttpServer())
      .get("/api/auth/yo")
      .set("Cookie", "__Host-sid=no-es-un-token")
      .expect(401);
  });

  it("cerrar sesión y cambiar la contraseña también exigen sesión", async () => {
    await request(app.getHttpServer()).post("/api/auth/logout").expect(401);
    await request(app.getHttpServer())
      .post("/api/auth/cambiar-contrasena")
      .send({ contrasenaActual: "una-clave-larga", contrasenaNueva: "otra-clave-larga" })
      .expect(401);
  });

  it("una ruta que no existe sigue respondiendo 404 y no 401", async () => {
    // El 404 no debe revelar nada, pero tampoco puede quedar tapado por el guard.
    await request(app.getHttpServer()).get("/api/no-existe").expect(404);
  });

  it("el inicio de sesión no exige sesión y valida lo que recibe", async () => {
    const respuesta = await request(app.getHttpServer())
      .post("/api/auth/login")
      .send({ correo: "", contrasena: "" })
      .expect(400);

    expect(respuesta.body.codigo).toBe("DATOS_INVALIDOS");
    expect(respuesta.body.detalles.map((d: { campo: string }) => d.campo).sort()).toEqual([
      "contrasena",
      "correo",
    ]);
  });
});
