import request from "supertest";

import { type ContextoIntegracion, crearAppConBaseDeDatos } from "../ayudantes/app-integracion.js";

// Las demás pruebas lo apagan para poder repetir inicios de sesión; esta es la que lo comprueba.
vi.hoisted(() => {
  process.env.LIMITE_SOLICITUDES = "activo";
});

let contexto: ContextoIntegracion;

beforeAll(async () => {
  contexto = await crearAppConBaseDeDatos();
});

afterAll(async () => {
  await contexto.cerrar();
});

const http = () => request(contexto.app.getHttpServer());

const login = () =>
  http()
    .post("/api/auth/login")
    .send({ correo: "nadie@omshato.test", contrasena: "clave-cualquiera" });
/** Un pedido vacío: el límite cuenta antes de validar, así que basta con que llegue. */
const pedido = () => http().post("/api/pedidos").send({});

describe("límite de solicitudes por IP (SEI-8)", () => {
  it("el inicio de sesión admite 10 intentos por ventana y rechaza el siguiente", async () => {
    for (let intento = 1; intento <= 10; intento += 1) {
      await login().expect(401);
    }

    const bloqueado = await login().expect(429);

    expect(bloqueado.body).toMatchObject({
      estado: 429,
      codigo: "DEMASIADAS_SOLICITUDES",
      mensaje: "Demasiadas solicitudes. Inténtalo más tarde.",
    });
    expect(Number(bloqueado.headers["retry-after"])).toBeGreaterThan(0);
  });

  it("cada ruta lleva su propia cuenta: agotar el login no frena los pedidos", async () => {
    await pedido().expect(400);
  });

  it("los pedidos admiten 10 envíos por ventana y rechazan el siguiente", async () => {
    // Uno ya se gastó en la prueba anterior.
    for (let intento = 2; intento <= 10; intento += 1) {
      await pedido().expect(400);
    }

    await pedido().expect(429);
  });

  it("las rutas públicas de lectura no tienen límite", async () => {
    for (let intento = 1; intento <= 30; intento += 1) {
      await http().get("/api/relojes").expect(200);
    }
  });
});
