import { PasswordHasher } from "@nestjs/authentication";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types.js";
import type { DataSource } from "typeorm";

import { AppModule } from "../../src/app.module.js";
import { configurarApp } from "../../src/configurar-app.js";
import { Administrador } from "../../src/modules/auth/entities/administrador.entity.js";
import { Sesion } from "../../src/modules/auth/entities/sesion.entity.js";
import { crearBaseDePrueba } from "../ayudantes/base-de-datos.js";

const CLAVE = "clave-de-prueba-123";
const ORIGEN_FRONT = "http://localhost:3000";

let app: INestApplication<App>;
let bd: DataSource;
// scrypt barato: la prueba no necesita el costo de producción.
const hasher = new PasswordHasher({ logN: 10 });
let contador = 0;

beforeAll(async () => {
  bd = await crearBaseDePrueba();
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PasswordHasher)
    .useValue(hasher)
    .compile();
  app = modulo.createNestApplication();
  configurarApp(app);
  await app.init();
});

afterAll(async () => {
  await app.close();
  await bd.destroy();
});

async function crearAdmin(cambios: Partial<Administrador> = {}) {
  contador += 1;
  return bd.getRepository(Administrador).save({
    nombre: "Administradora de prueba",
    correo: `admin${contador}@omshato.test`,
    contrasenaHash: await hasher.hash(CLAVE),
    ...cambios,
  });
}

function http() {
  return request(app.getHttpServer());
}

/** Inicia sesión como lo haría el front (con su origen) y devuelve la respuesta. */
function iniciarSesion(correo: string, contrasena: string) {
  return http().post("/api/auth/login").set("Origin", ORIGEN_FRONT).send({ correo, contrasena });
}

/** `__Host-sid=<token>` de la respuesta, listo para enviarlo de vuelta. */
function cookieDe(respuesta: request.Response) {
  const cookies = (respuesta.headers["set-cookie"] ?? []) as unknown as string[];
  const cookie = cookies.find((c) => c.startsWith("__Host-sid="));
  if (!cookie) {
    throw new Error(`La respuesta no trae cookie de sesión: ${JSON.stringify(cookies)}`);
  }
  return cookie.split(";")[0];
}

/** Inicia sesión y devuelve la cookie, para las pruebas que no son del inicio de sesión. */
async function sesionDe(correo: string, contrasena = CLAVE) {
  const respuesta = await iniciarSesion(correo, contrasena).expect(200);
  return cookieDe(respuesta);
}

function fila(correo: string) {
  return bd.getRepository(Administrador).findOneByOrFail({ correo });
}

describe("inicio de sesión", () => {
  it("crea la sesión en una cookie HttpOnly y no devuelve datos sensibles", async () => {
    const admin = await crearAdmin();

    const respuesta = await iniciarSesion(admin.correo, CLAVE).expect(200);

    expect(respuesta.body).toEqual({
      administrador: { id: admin.id, nombre: admin.nombre, correo: admin.correo },
    });
    const cookie = (respuesta.headers["set-cookie"] as unknown as string[])[0];
    expect(cookie).toMatch(/^__Host-sid=[A-Za-z0-9_-]{20,}/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/Secure/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\//);
  });

  it("la sesión abre las rutas protegidas (REQ-AUT-1)", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);

    const respuesta = await http().get("/api/auth/yo").set("Cookie", cookie).expect(200);

    expect(respuesta.body.administrador).toEqual({
      id: admin.id,
      nombre: admin.nombre,
      correo: admin.correo,
    });
  });

  it("guarda el hash del token y no el token", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);
    const token = cookie.split("=")[1];

    const sesiones = await bd.getRepository(Sesion).findBy({ idAdministrador: admin.id });

    expect(sesiones).toHaveLength(1);
    expect(sesiones[0].id).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(sesiones[0].id).not.toBe(token);
  });

  it("ignora mayúsculas y espacios del correo", async () => {
    const admin = await crearAdmin();

    await iniciarSesion(`  ${admin.correo.toUpperCase()} `, CLAVE).expect(200);
  });

  it("un correo desconocido y una contraseña equivocada dan la misma respuesta (REQ-AUT-3)", async () => {
    const admin = await crearAdmin();

    const desconocido = await iniciarSesion("nadie@omshato.test", CLAVE).expect(401);
    const equivocada = await iniciarSesion(admin.correo, "otra-clave-cualquiera").expect(401);

    const comparable = ({ body }: request.Response) => ({
      estado: body.estado,
      codigo: body.codigo,
      mensaje: body.mensaje,
    });
    expect(comparable(desconocido)).toEqual(comparable(equivocada));
    expect(desconocido.body.codigo).toBe("CREDENCIALES_INVALIDAS");
    expect(desconocido.headers["set-cookie"]).toBeUndefined();
  });

  it("rechaza el inicio de sesión que viene de la página de otro sitio", async () => {
    const admin = await crearAdmin();

    const respuesta = await http()
      .post("/api/auth/login")
      .set("Origin", "https://sitio-malicioso.com")
      .set("Sec-Fetch-Site", "cross-site")
      .send({ correo: admin.correo, contrasena: CLAVE })
      .expect(403);

    expect(respuesta.headers["set-cookie"]).toBeUndefined();
  });

  it("acepta el inicio de sesión desde el front, que vive en otro origen", async () => {
    const admin = await crearAdmin();

    await http()
      .post("/api/auth/login")
      .set("Origin", ORIGEN_FRONT)
      .set("Sec-Fetch-Site", "same-site")
      .send({ correo: admin.correo, contrasena: CLAVE })
      .expect(200);
  });
});

describe("bloqueo por intentos fallidos (REQ-AUT-4, TBD-17)", () => {
  it("bloquea la cuenta al quinto intento fallido y hasta la contraseña correcta queda rechazada", async () => {
    const admin = await crearAdmin();

    for (let intento = 1; intento <= 5; intento += 1) {
      await iniciarSesion(admin.correo, "clave-equivocada").expect(401);
    }
    const bloqueada = await iniciarSesion(admin.correo, CLAVE).expect(429);

    expect(bloqueada.body.codigo).toBe("CUENTA_BLOQUEADA");
    expect(bloqueada.body.mensaje).toMatch(/15 minutos/);
    expect(bloqueada.headers["set-cookie"]).toBeUndefined();

    const guardada = await fila(admin.correo);
    expect(guardada.intentosFallidos).toBe(5);
    const minutos = (guardada.bloqueadoHasta!.getTime() - Date.now()) / 60_000;
    expect(minutos).toBeGreaterThan(14);
    expect(minutos).toBeLessThanOrEqual(15);
  });

  it("no bloquea antes del quinto intento", async () => {
    const admin = await crearAdmin();

    for (let intento = 1; intento <= 4; intento += 1) {
      await iniciarSesion(admin.correo, "clave-equivocada").expect(401);
    }

    await iniciarSesion(admin.correo, CLAVE).expect(200);
  });

  it("un inicio de sesión correcto reinicia el conteo", async () => {
    const admin = await crearAdmin();
    await iniciarSesion(admin.correo, "clave-equivocada").expect(401);
    await iniciarSesion(admin.correo, "clave-equivocada").expect(401);
    expect((await fila(admin.correo)).intentosFallidos).toBe(2);

    await iniciarSesion(admin.correo, CLAVE).expect(200);

    expect((await fila(admin.correo)).intentosFallidos).toBe(0);
  });

  it("al vencer el bloqueo la cuenta vuelve a entrar", async () => {
    const admin = await crearAdmin({
      intentosFallidos: 5,
      bloqueadoHasta: new Date(Date.now() - 1000),
    });

    await iniciarSesion(admin.correo, CLAVE).expect(200);

    const guardada = await fila(admin.correo);
    expect(guardada.intentosFallidos).toBe(0);
    expect(guardada.bloqueadoHasta).toBeNull();
  });

  it("tras vencer el bloqueo, un fallo cuenta como el primero y no bloquea otra vez", async () => {
    const admin = await crearAdmin({
      intentosFallidos: 5,
      bloqueadoHasta: new Date(Date.now() - 1000),
    });

    await iniciarSesion(admin.correo, "clave-equivocada").expect(401);

    const guardada = await fila(admin.correo);
    expect(guardada.intentosFallidos).toBe(1);
    expect(guardada.bloqueadoHasta).toBeNull();
  });

  it("cinco intentos simultáneos se cuentan los cinco", async () => {
    const admin = await crearAdmin();

    await Promise.all(
      Array.from({ length: 5 }, () => iniciarSesion(admin.correo, "clave-equivocada")),
    );

    const guardada = await fila(admin.correo);
    expect(guardada.intentosFallidos).toBe(5);
    expect(guardada.bloqueadoHasta).not.toBeNull();
  });

  it("los intentos sobre una cuenta bloqueada no alargan el bloqueo", async () => {
    const admin = await crearAdmin();
    for (let intento = 1; intento <= 5; intento += 1) {
      await iniciarSesion(admin.correo, "clave-equivocada").expect(401);
    }
    const antes = (await fila(admin.correo)).bloqueadoHasta!.getTime();

    await iniciarSesion(admin.correo, "clave-equivocada").expect(429);

    expect((await fila(admin.correo)).bloqueadoHasta!.getTime()).toBe(antes);
  });
});

describe("sesión", () => {
  it("cerrar sesión la borra del servidor y la cookie deja de servir (CU-11)", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);

    const respuesta = await http()
      .post("/api/auth/logout")
      .set("Origin", ORIGEN_FRONT)
      .set("Cookie", cookie)
      .expect(204);

    expect((respuesta.headers["set-cookie"] as unknown as string[])[0]).toMatch(/Max-Age=0/);
    await http().get("/api/auth/yo").set("Cookie", cookie).expect(401);
    expect(await bd.getRepository(Sesion).countBy({ idAdministrador: admin.id })).toBe(0);
  });

  it("se cierra por inactividad (REQ-AUT-5)", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);
    await bd.query(
      "UPDATE sesion SET ultima_actividad = now() - interval '2 hours' WHERE id_administrador = $1",
      [admin.id],
    );

    await http().get("/api/auth/yo").set("Cookie", cookie).expect(401);
  });

  it("la actividad aplaza el cierre por inactividad", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);
    await bd.query(
      "UPDATE sesion SET ultima_actividad = now() - interval '10 minutes' WHERE id_administrador = $1",
      [admin.id],
    );

    await http().get("/api/auth/yo").set("Cookie", cookie).expect(200);

    const [sesion] = await bd.getRepository(Sesion).findBy({ idAdministrador: admin.id });
    expect(Date.now() - sesion.ultimaActividad.getTime()).toBeLessThan(60_000);
  });

  it("vence al llegar a la duración máxima aunque haya actividad", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);
    await bd.query(
      "UPDATE sesion SET fecha_expiracion = now() - interval '1 second' WHERE id_administrador = $1",
      [admin.id],
    );

    await http().get("/api/auth/yo").set("Cookie", cookie).expect(401);
  });

  it("una cuenta eliminada pierde su sesión", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);

    await bd.getRepository(Administrador).delete({ id: admin.id });

    await http().get("/api/auth/yo").set("Cookie", cookie).expect(401);
  });

  it("una escritura enviada desde la página de otro sitio no usa la cookie (CSRF)", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);

    await http()
      .post("/api/auth/logout")
      .set("Origin", "https://sitio-malicioso.com")
      .set("Sec-Fetch-Site", "cross-site")
      .set("Cookie", cookie)
      .expect(401);

    // La sesión sigue viva: el ataque no logró cerrarla.
    await http().get("/api/auth/yo").set("Cookie", cookie).expect(200);
  });
});

describe("cambio de contraseña (CU-12)", () => {
  const NUEVA = "una-clave-nueva-456";

  it("cambia la contraseña, cierra las demás sesiones y conserva la actual", async () => {
    const admin = await crearAdmin();
    const cookieActual = await sesionDe(admin.correo);
    const cookieOtroDispositivo = await sesionDe(admin.correo);

    const respuesta = await http()
      .post("/api/auth/cambiar-contrasena")
      .set("Origin", ORIGEN_FRONT)
      .set("Cookie", cookieActual)
      .send({ contrasenaActual: CLAVE, contrasenaNueva: NUEVA })
      .expect(204);
    const cookieNueva = cookieDe(respuesta);

    // La cookie anterior se reemplazó por una nueva; la del otro dispositivo se cerró.
    expect(cookieNueva).not.toBe(cookieActual);
    await http().get("/api/auth/yo").set("Cookie", cookieActual).expect(401);
    await http().get("/api/auth/yo").set("Cookie", cookieOtroDispositivo).expect(401);
    await http().get("/api/auth/yo").set("Cookie", cookieNueva).expect(200);

    await iniciarSesion(admin.correo, CLAVE).expect(401);
    await iniciarSesion(admin.correo, NUEVA).expect(200);
  });

  it("guarda un hash distinto y nunca la contraseña", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);

    await http()
      .post("/api/auth/cambiar-contrasena")
      .set("Origin", ORIGEN_FRONT)
      .set("Cookie", cookie)
      .send({ contrasenaActual: CLAVE, contrasenaNueva: NUEVA })
      .expect(204);

    const { contrasenaHash } = await fila(admin.correo);
    expect(contrasenaHash).not.toBe(admin.contrasenaHash);
    expect(contrasenaHash).not.toContain(NUEVA);
    expect(contrasenaHash).toMatch(/^\$scrypt\$/);
  });

  it("rechaza la contraseña actual equivocada y lo cuenta como intento fallido", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);

    const respuesta = await http()
      .post("/api/auth/cambiar-contrasena")
      .set("Origin", ORIGEN_FRONT)
      .set("Cookie", cookie)
      .send({ contrasenaActual: "no-es-la-actual", contrasenaNueva: NUEVA })
      .expect(422);

    expect(respuesta.body.codigo).toBe("CONTRASENA_ACTUAL_INCORRECTA");
    expect((await fila(admin.correo)).intentosFallidos).toBe(1);
    await iniciarSesion(admin.correo, CLAVE).expect(200);
  });

  it("valida la contraseña nueva", async () => {
    const admin = await crearAdmin();
    const cookie = await sesionDe(admin.correo);
    const cambiar = (cuerpo: object) =>
      http()
        .post("/api/auth/cambiar-contrasena")
        .set("Origin", ORIGEN_FRONT)
        .set("Cookie", cookie)
        .send(cuerpo);

    const corta = await cambiar({ contrasenaActual: CLAVE, contrasenaNueva: "corta" }).expect(400);
    const igual = await cambiar({ contrasenaActual: CLAVE, contrasenaNueva: CLAVE }).expect(400);

    expect(corta.body.detalles[0].campo).toBe("contrasenaNueva");
    expect(igual.body.detalles[0].campo).toBe("contrasenaNueva");
  });
});
