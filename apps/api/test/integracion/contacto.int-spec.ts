import request from "supertest";

import { ejecutarSeeds } from "../../src/database/seeds/ejecutar-seeds.js";
import {
  type ContextoIntegracion,
  crearAppConBaseDeDatos,
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

const COMPLETOS = {
  whatsapp: { valor: "300 123 4567", activo: true },
  instagram: { valor: "https://www.instagram.com/omsha_to", activo: true },
  tiktok: { valor: "https://www.tiktok.com/@omsha_to", activo: false },
};

describe("contacto", () => {
  it("al inicio no muestra ningún icono (REQ-CON-4)", async () => {
    const respuesta = await http().get("/api/contacto").expect(200);

    expect(respuesta.body).toEqual({ whatsapp: null, instagram: null, tiktok: null });
  });

  it("el panel siempre tiene los tres enlaces para editar", async () => {
    const respuesta = await http().get("/api/admin/contacto").set("Cookie", cookie).expect(200);

    expect(respuesta.body.map((e: { tipo: string }) => e.tipo)).toEqual([
      "WHATSAPP",
      "INSTAGRAM",
      "TIKTOK",
    ]);
    expect(respuesta.body.every((e: { activo: boolean }) => !e.activo)).toBe(true);
  });

  it("guarda los enlaces y el sitio muestra solo los activos", async () => {
    const guardados = await http()
      .put("/api/admin/contacto")
      .set("Cookie", cookie)
      .send(COMPLETOS)
      .expect(200);
    expect(guardados.body).toHaveLength(3);

    const publico = await http().get("/api/contacto").expect(200);

    expect(publico.body).toEqual({
      whatsapp: { numero: "573001234567", visible: "+57 300 123 4567" },
      instagram: { url: "https://www.instagram.com/omsha_to", usuario: "omsha_to" },
      tiktok: null,
    });
  });

  it("un enlace desactivado deja de mostrarse sin perder lo escrito", async () => {
    await http()
      .put("/api/admin/contacto")
      .set("Cookie", cookie)
      .send({ ...COMPLETOS, whatsapp: { valor: "300 123 4567", activo: false } })
      .expect(200);

    const publico = await http().get("/api/contacto").expect(200);
    const panel = await http().get("/api/admin/contacto").set("Cookie", cookie).expect(200);

    expect(publico.body.whatsapp).toBeNull();
    expect(panel.body[0]).toMatchObject({ tipo: "WHATSAPP", valor: "300 123 4567", activo: false });
  });

  it("volver a correr los seeds no borra lo que el administrador escribió", async () => {
    await ejecutarSeeds(contexto.bd);

    const panel = await http().get("/api/admin/contacto").set("Cookie", cookie).expect(200);
    expect(panel.body[1]).toMatchObject({
      tipo: "INSTAGRAM",
      valor: "https://www.instagram.com/omsha_to",
      activo: true,
    });
  });

  it("rechaza un enlace activo vacío y un perfil de otro sitio", async () => {
    const vacio = await http()
      .put("/api/admin/contacto")
      .set("Cookie", cookie)
      .send({ ...COMPLETOS, tiktok: { valor: "", activo: true } })
      .expect(400);
    const ajeno = await http()
      .put("/api/admin/contacto")
      .set("Cookie", cookie)
      .send({ ...COMPLETOS, instagram: { valor: "https://otro-sitio.com/perfil", activo: true } })
      .expect(400);

    expect(vacio.body.detalles[0].campo).toBe("tiktok.valor");
    expect(ajeno.body.detalles[0].campo).toBe("instagram.valor");
  });

  it("editar el contacto exige sesión (REQ-AUT-1)", async () => {
    await http().get("/api/admin/contacto").expect(401);
    await http().put("/api/admin/contacto").send(COMPLETOS).expect(401);
  });
});
