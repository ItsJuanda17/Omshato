import { PasswordHasher } from "@nestjs/authentication";
import type { DataSource } from "typeorm";

import dataSourceCli from "../../src/database/data-source.js";
import { registrarAdministrador } from "../../src/database/seeds/administrador.js";
import { Administrador } from "../../src/modules/auth/entities/administrador.entity.js";
import { crearBaseDePrueba } from "../ayudantes/base-de-datos.js";

/** Con entidades registradas, para leer y preparar datos en las pruebas. */
let bd: DataSource;
const hasher = new PasswordHasher({ logN: 10 });
const DATOS = {
  nombre: "Dueña de Omshato",
  correo: "duena@omshato.test",
  contrasena: "clave-inicial-123",
};

beforeAll(async () => {
  bd = await crearBaseDePrueba();
  // El mismo DataSource que usa `pnpm admin:crear`: sin entidades registradas.
  await dataSourceCli.initialize();
});

afterAll(async () => {
  await dataSourceCli.destroy();
  await bd.destroy();
});

/** Lo que hace la CLI: registrar con su propio DataSource. */
function registrar(datos: typeof DATOS) {
  return registrarAdministrador(dataSourceCli, datos, hasher);
}

describe("registrarAdministrador", () => {
  it("crea la cuenta con la contraseña protegida por hash", async () => {
    const resultado = await registrar(DATOS);

    const cuenta = await bd.getRepository(Administrador).findOneByOrFail({ correo: DATOS.correo });
    expect(resultado).toBe("creada");
    expect(cuenta.nombre).toBe(DATOS.nombre);
    expect(cuenta.contrasenaHash).not.toContain(DATOS.contrasena);
    expect(await hasher.verify(DATOS.contrasena, cuenta.contrasenaHash)).toBe(true);
  });

  it("guarda el correo normalizado y no duplica la cuenta", async () => {
    const datos = { ...DATOS, correo: "  Otra.Persona@Omshato.TEST " };

    await registrar(datos);
    const resultado = await registrar(datos);

    expect(resultado).toBe("actualizada");
    expect(
      await bd.getRepository(Administrador).countBy({ correo: "otra.persona@omshato.test" }),
    ).toBe(1);
  });

  it("al restablecer cambia la contraseña, quita el bloqueo y cierra las sesiones", async () => {
    const correo = "recuperar@omshato.test";
    await registrar({ ...DATOS, correo });
    const cuenta = await bd.getRepository(Administrador).findOneByOrFail({ correo });
    await bd.getRepository(Administrador).update(
      { id: cuenta.id },
      {
        intentosFallidos: 5,
        bloqueadoHasta: new Date(Date.now() + 600_000),
      },
    );
    await bd.query(
      `INSERT INTO sesion (id_sesion, id_administrador, fecha_creacion, fecha_expiracion, ultima_actividad)
       VALUES ('sesion-abierta', $1, now(), now() + interval '1 hour', now())`,
      [cuenta.id],
    );

    await registrar({ ...DATOS, correo, contrasena: "clave-recuperada-456" });

    const despues = await bd.getRepository(Administrador).findOneByOrFail({ id: cuenta.id });
    expect(despues.intentosFallidos).toBe(0);
    expect(despues.bloqueadoHasta).toBeNull();
    expect(await hasher.verify("clave-recuperada-456", despues.contrasenaHash)).toBe(true);
    expect(await hasher.verify(DATOS.contrasena, despues.contrasenaHash)).toBe(false);
    expect(await bd.query("SELECT 1 FROM sesion WHERE id_administrador = $1", [cuenta.id])).toEqual(
      [],
    );
  });

  it("rechaza una contraseña corta y un correo inválido sin tocar la base", async () => {
    await expect(
      registrar({ ...DATOS, correo: "corta@omshato.test", contrasena: "corta" }),
    ).rejects.toThrow();
    await expect(registrar({ ...DATOS, correo: "no-es-un-correo" })).rejects.toThrow();

    expect(await bd.getRepository(Administrador).countBy({ correo: "corta@omshato.test" })).toBe(0);
  });
});
