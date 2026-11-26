import { PasswordHasher } from "@nestjs/authentication";
import type { INestApplication } from "@nestjs/common";
import { StorageDisk } from "@nestjs/storage";
import { Test } from "@nestjs/testing";
import { rm } from "node:fs/promises";
import { resolve } from "node:path";
import request from "supertest";
import type { App } from "supertest/types.js";
import type { DataSource } from "typeorm";

import { AppModule } from "../../src/app.module.js";
import { configurarApp } from "../../src/configurar-app.js";
import { Administrador } from "../../src/modules/auth/entities/administrador.entity.js";
import { crearBaseDePrueba } from "./base-de-datos.js";

export const CLAVE = "clave-de-prueba-123";
const hasher = new PasswordHasher({ logN: 10 });
let contador = 0;

/** Una imagen PNG de 1×1 píxel: lo mínimo que el almacenamiento reconoce como foto. */
export const PNG_MINIMO = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

export interface ContextoIntegracion {
  app: INestApplication<App>;
  bd: DataSource;
  /** El disco donde el API guarda las fotos, para comprobar qué hay en él. */
  disco: StorageDisk;
  cerrar: () => Promise<void>;
}

/**
 * La aplicación completa contra la base de pruebas recién reiniciada y una carpeta de fotos
 * vacía, con la misma configuración que producción y un hash de contraseñas barato.
 */
export async function crearAppConBaseDeDatos(): Promise<ContextoIntegracion> {
  const bd = await crearBaseDePrueba();
  await rm(resolve(process.env.ALMACENAMIENTO_RUTA ?? "./.tmp/almacenamiento-pruebas"), {
    recursive: true,
    force: true,
  });
  const modulo = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(PasswordHasher)
    .useValue(hasher)
    .compile();
  const app: INestApplication<App> = modulo.createNestApplication();
  configurarApp(app);
  await app.init();

  return {
    app,
    bd,
    disco: app.get(StorageDisk),
    cerrar: async () => {
      await app.close();
      await bd.destroy();
    },
  };
}

/** Crea un administrador, inicia sesión con él y devuelve su cookie `__Host-sid=…`. */
export async function sesionDeAdministrador(contexto: ContextoIntegracion) {
  contador += 1;
  const correo = `admin-sesion${contador}@omshato.test`;
  const administrador = await contexto.bd.getRepository(Administrador).save({
    nombre: "Administradora de prueba",
    correo,
    contrasenaHash: await hasher.hash(CLAVE),
  });

  const respuesta = await request(contexto.app.getHttpServer())
    .post("/api/auth/login")
    .send({ correo, contrasena: CLAVE })
    .expect(200);
  const cookies = respuesta.headers["set-cookie"] as unknown as string[];
  return { cookie: cookies[0].split(";")[0], idAdministrador: administrador.id };
}

/** Sube una foto por el endpoint real y devuelve su clave. */
export async function subirFoto(contexto: ContextoIntegracion, cookie: string) {
  const respuesta = await request(contexto.app.getHttpServer())
    .post("/api/admin/fotos")
    .set("Cookie", cookie)
    .attach("foto", PNG_MINIMO, { filename: "reloj.png", contentType: "image/png" })
    .expect(201);
  return respuesta.body.archivo as string;
}
