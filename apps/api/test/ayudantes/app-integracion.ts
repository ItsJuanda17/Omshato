import { PasswordHasher } from "@nestjs/authentication";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import type { App } from "supertest/types.js";
import type { DataSource } from "typeorm";

import { AppModule } from "../../src/app.module.js";
import { configurarApp } from "../../src/configurar-app.js";
import { Administrador } from "../../src/modules/auth/entities/administrador.entity.js";
import { crearBaseDePrueba } from "./base-de-datos.js";

const CLAVE = "clave-de-prueba-123";
const hasher = new PasswordHasher({ logN: 10 });
let contador = 0;

export interface ContextoIntegracion {
  app: INestApplication<App>;
  bd: DataSource;
  cerrar: () => Promise<void>;
}

/**
 * La aplicación completa contra la base de pruebas recién reiniciada, con la misma
 * configuración que producción y un hash de contraseñas barato.
 */
export async function crearAppConBaseDeDatos(): Promise<ContextoIntegracion> {
  const bd = await crearBaseDePrueba();
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
