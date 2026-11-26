import request from "supertest";

import {
  type ContextoIntegracion,
  crearAppConBaseDeDatos,
  PNG_MINIMO,
  sesionDeAdministrador,
} from "../ayudantes/app-integracion.js";

let contexto: ContextoIntegracion;
let cookie: string;

beforeAll(async () => {
  contexto = await crearAppConBaseDeDatos();
  ({ cookie } = await sesionDeAdministrador(contexto));
});

afterAll(async () => {
  await contexto.cerrar();
});

const http = () => request(contexto.app.getHttpServer());

function subir(contenido: Buffer, nombre = "reloj.png", tipo = "image/png") {
  return http()
    .post("/api/admin/fotos")
    .set("Cookie", cookie)
    .attach("foto", contenido, { filename: nombre, contentType: tipo });
}

describe("subir una foto", () => {
  it("la guarda con una clave aleatoria y devuelve esa clave", async () => {
    const respuesta = await subir(PNG_MINIMO).expect(201);

    expect(respuesta.body.archivo).toMatch(/^relojes\/[0-9a-f-]{36}\.png$/);
    expect(await contexto.disco.exists(respuesta.body.archivo)).toBe(true);
  });

  it("ignora el nombre que manda el navegador", async () => {
    const respuesta = await subir(PNG_MINIMO, "../../secreto.png").expect(201);

    expect(respuesta.body.archivo).toMatch(/^relojes\/[0-9a-f-]{36}\.png$/);
  });

  it("decide el tipo por el contenido y no por lo que diga el navegador", async () => {
    const texto = Buffer.from("esto no es una imagen, aunque se llame reloj.png");

    const respuesta = await subir(texto, "reloj.png", "image/png").expect(415);

    expect(respuesta.body.codigo).toBe("TIPO_NO_PERMITIDO");
    expect(respuesta.body.mensaje).toMatch(/JPG, PNG, WebP o AVIF/);
  });

  it("rechaza una foto de más de 5 MB sin guardar nada", async () => {
    const grande = Buffer.concat([PNG_MINIMO, Buffer.alloc(5 * 1024 * 1024)]);

    const respuesta = await subir(grande).expect(413);

    expect(respuesta.body.codigo).toBe("ARCHIVO_MUY_GRANDE");
  });

  it("pide la foto en el campo «foto»", async () => {
    const respuesta = await http().post("/api/admin/fotos").set("Cookie", cookie).expect(400);

    expect(respuesta.body.codigo).toBe("FOTO_REQUERIDA");
  });

  it("exige sesión (REQ-AUT-1)", async () => {
    await http()
      .post("/api/admin/fotos")
      .attach("foto", PNG_MINIMO, { filename: "reloj.png", contentType: "image/png" })
      .expect(401);
  });
});

describe("ver una foto", () => {
  it("la sirve a cualquiera, para que el catálogo pueda mostrarla desde otro origen", async () => {
    const { body } = await subir(PNG_MINIMO).expect(201);

    const respuesta = await http().get(`/api/fotos/${body.archivo}`).expect(200);

    expect(respuesta.headers["content-type"]).toBe("image/png");
    expect(respuesta.headers["cross-origin-resource-policy"]).toBe("cross-origin");
    expect(respuesta.headers["cache-control"]).toMatch(/immutable/);
    expect(respuesta.headers["x-content-type-options"]).toBe("nosniff");
    expect(Buffer.from(respuesta.body).equals(PNG_MINIMO)).toBe(true);
  });

  it("responde 404 si la foto no existe", async () => {
    await http().get("/api/fotos/relojes/no-existe.png").expect(404);
  });

  it.each(["..%2Fsecreto.png", "foto.exe", "carpeta%2Ffoto.png"])(
    "no sirve el nombre %s",
    async (nombre) => {
      const respuesta = await http().get(`/api/fotos/relojes/${nombre}`);

      expect([400, 404]).toContain(respuesta.status);
    },
  );
});
