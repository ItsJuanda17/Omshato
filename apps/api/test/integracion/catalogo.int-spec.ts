import request from "supertest";

import {
  type ContextoIntegracion,
  crearAppConBaseDeDatos,
  sesionDeAdministrador,
  subirFoto,
} from "../ayudantes/app-integracion.js";

let contexto: ContextoIntegracion;
let cookie: string;
let idAdministrador: number;
let contador = 0;
/** Claves de fotos ya subidas, que los relojes de estas pruebas reutilizan. */
const fotos = { principal: "", segunda: "", nueva: "" };

beforeAll(async () => {
  contexto = await crearAppConBaseDeDatos();
  ({ cookie, idAdministrador } = await sesionDeAdministrador(contexto));
  fotos.principal = await subirFoto(contexto, cookie);
  fotos.segunda = await subirFoto(contexto, cookie);
  fotos.nueva = await subirFoto(contexto, cookie);
});

afterAll(async () => {
  await contexto.cerrar();
});

const http = () => request(contexto.app.getHttpServer());

/** Lo que enviaría el formulario del panel. Cada llamada produce un nombre único. */
function datosReloj(cambios: Record<string, unknown> = {}) {
  contador += 1;
  return {
    nombre: `Presage Cocktail ${contador}`,
    idMarca: null,
    marcaNueva: "Seiko",
    genero: "Hombre",
    precioCop: 3_450_000,
    modo: "DISPONIBLE",
    cantidad: 2,
    plazoEstimado: null,
    garantia: "12 meses",
    detalleMecanica: "Calibre: 4R35",
    descripcion: "Esfera azul",
    visible: true,
    fotos: [fotos.principal, fotos.segunda],
    ...cambios,
  };
}

async function crear(cambios: Record<string, unknown> = {}) {
  const respuesta = await http()
    .post("/api/admin/relojes")
    .set("Cookie", cookie)
    .send(datosReloj(cambios))
    .expect(201);
  return respuesta.body as {
    id: number;
    urlAmigable: string;
    marca: { id: number; nombre: string };
    [clave: string]: unknown;
  };
}

describe("catálogo vacío", () => {
  it("no muestra relojes ni marcas", async () => {
    expect((await http().get("/api/relojes").expect(200)).body).toEqual([]);
    expect((await http().get("/api/marcas").expect(200)).body).toEqual([]);
  });
});

describe("crear un reloj (CU-13)", () => {
  it("lo publica con su marca, su URL propia y la primera foto como principal", async () => {
    const reloj = await crear({ nombre: "Presage Cocktail Time" });

    expect(reloj).toMatchObject({
      marca: { nombre: "Seiko" },
      nombre: "Presage Cocktail Time",
      genero: "Hombre",
      precioCop: 3_450_000,
      cantidad: 2,
      modo: "DISPONIBLE",
      visible: true,
      plazoEstimado: null,
      urlAmigable: "seiko-presage-cocktail-time",
      cantidadPedidos: 0,
    });
    expect(reloj.imagenes).toEqual([
      expect.objectContaining({ archivo: fotos.principal, orden: 1, esPrincipal: true }),
      expect.objectContaining({ archivo: fotos.segunda, orden: 2, esPrincipal: false }),
    ]);
    expect(typeof reloj.fechaPublicacion).toBe("string");
  });

  it("agrega un número a la URL si el nombre se repite (REQ-CAT-7)", async () => {
    const primero = await crear({ nombre: "Repetido", marcaNueva: "Orient" });
    const segundo = await crear({ nombre: "Repetido", marcaNueva: "Orient" });
    const tercero = await crear({ nombre: "Repetido", marcaNueva: "Orient" });

    expect([primero.urlAmigable, segundo.urlAmigable, tercero.urlAmigable]).toEqual([
      "orient-repetido",
      "orient-repetido-2",
      "orient-repetido-3",
    ]);
  });

  it("reutiliza la marca aunque se escriba con otras mayúsculas (REQ-ADM-12)", async () => {
    const a = await crear({ marcaNueva: "Citizen" });
    const b = await crear({ marcaNueva: " citizen " });

    expect(b.marca.id).toBe(a.marca.id);
    expect(b.marca.nombre).toBe("Citizen");
  });

  it("acepta una marca existente por su id", async () => {
    const existente = await crear({ marcaNueva: "Casio" });

    const reloj = await crear({ idMarca: existente.marca.id, marcaNueva: null });

    expect(reloj.marca).toEqual(existente.marca);
  });

  it("guarda solo lo que corresponde al modo (TBD-2, TBD-7)", async () => {
    const bajoPedido = await crear({
      modo: "BAJO_PEDIDO",
      cantidad: 5,
      plazoEstimado: "8 a 15 días hábiles",
    });
    const disponible = await crear({ modo: "DISPONIBLE", cantidad: 1, plazoEstimado: "10 días" });

    expect(bajoPedido).toMatchObject({ cantidad: null, plazoEstimado: "8 a 15 días hábiles" });
    expect(disponible).toMatchObject({ cantidad: 1, plazoEstimado: null });
  });

  it("guarda como nulo los textos opcionales vacíos", async () => {
    const reloj = await crear({ detalleMecanica: "  ", descripcion: "" });

    expect(reloj).toMatchObject({ detalleMecanica: null, descripcion: null });
  });
});

describe("validación al guardar un reloj", () => {
  const rechazar = async (cambios: Record<string, unknown>) =>
    (
      await http()
        .post("/api/admin/relojes")
        .set("Cookie", cookie)
        .send(datosReloj(cambios))
        .expect(400)
    ).body as { codigo: string; detalles: { campo: string; mensaje: string }[] };

  it.each([
    ["cero", 0],
    ["negativo", -5],
    ["con decimales", 1.5],
    ["texto", "3450000"],
  ])("rechaza un precio %s (REQ-ADM-3)", async (_caso, precioCop) => {
    const cuerpo = await rechazar({ precioCop });

    expect(cuerpo.codigo).toBe("DATOS_INVALIDOS");
    expect(cuerpo.detalles[0].campo).toBe("precioCop");
  });

  it("exige la cantidad en un reloj Disponible", async () => {
    const cuerpo = await rechazar({ modo: "DISPONIBLE", cantidad: null });

    expect(cuerpo.detalles[0].campo).toBe("cantidad");
  });

  it("rechaza una cantidad negativa", async () => {
    const cuerpo = await rechazar({ cantidad: -1 });

    expect(cuerpo.detalles[0].campo).toBe("cantidad");
  });

  it("exige una marca", async () => {
    const cuerpo = await rechazar({ idMarca: null, marcaNueva: " " });

    expect(cuerpo.detalles[0].campo).toBe("idMarca");
  });

  it("exige al menos una foto y rechaza rutas que salen de la carpeta", async () => {
    expect((await rechazar({ fotos: [] })).detalles[0].campo).toBe("fotos");
    expect((await rechazar({ fotos: ["../secreto.jpg"] })).detalles[0].campo).toBe("fotos.0");
    expect((await rechazar({ fotos: ["relojes/archivo.exe"] })).detalles[0].campo).toBe("fotos.0");
  });

  it("rechaza más de 10 fotos", async () => {
    const muchas = Array.from({ length: 11 }, (_, i) => `relojes/foto-${i}.jpg`);

    expect((await rechazar({ fotos: muchas })).detalles[0].campo).toBe("fotos");
  });

  it("rechaza una marca que no existe con un código propio", async () => {
    const respuesta = await http()
      .post("/api/admin/relojes")
      .set("Cookie", cookie)
      .send(datosReloj({ idMarca: 99_999, marcaNueva: null }))
      .expect(422);

    expect(respuesta.body.codigo).toBe("MARCA_NO_EXISTE");
  });
});

describe("lo que ve el comprador (REQ-CAT-1, REQ-DET-6)", () => {
  it("el catálogo muestra solo relojes visibles, del más reciente al más antiguo", async () => {
    const antiguo = await crear({ nombre: "Orden antiguo" });
    const oculto = await crear({ nombre: "Orden oculto", visible: false });
    const reciente = await crear({ nombre: "Orden reciente" });

    const lista = (await http().get("/api/relojes").expect(200)).body as { id: number }[];
    const posiciones = [reciente.id, antiguo.id].map((id) => lista.findIndex((r) => r.id === id));

    expect(lista.some((r) => r.id === oculto.id)).toBe(false);
    expect(posiciones[0]).toBeGreaterThanOrEqual(0);
    expect(posiciones[0]).toBeLessThan(posiciones[1]);
  });

  it("cada tarjeta trae lo necesario y nada más (REQ-CAT-2)", async () => {
    const reloj = await crear({ nombre: "Tarjeta" });

    const lista = (await http().get("/api/relojes").expect(200)).body as { id: number }[];
    const tarjeta = lista.find((r) => r.id === reloj.id);

    expect(tarjeta).toEqual({
      id: reloj.id,
      marca: reloj.marca,
      nombre: "Tarjeta",
      precioCop: 3_450_000,
      modo: "DISPONIBLE",
      urlAmigable: reloj.urlAmigable,
      imagenPrincipal: expect.objectContaining({
        archivo: fotos.principal,
        esPrincipal: true,
      }),
    });
  });

  it("la ficha se abre por su URL amigable", async () => {
    const reloj = await crear({ nombre: "Ficha publica" });

    const ficha = await http().get(`/api/relojes/${reloj.urlAmigable}`).expect(200);

    expect(ficha.body).toMatchObject({
      id: reloj.id,
      nombre: "Ficha publica",
      detalleMecanica: "Calibre: 4R35",
      garantia: "12 meses",
    });
    expect(ficha.body.imagenes).toHaveLength(2);
    expect(ficha.body).not.toHaveProperty("cantidadPedidos");
  });

  it("un reloj oculto responde igual que uno que no existe", async () => {
    const oculto = await crear({ nombre: "Ficha oculta", visible: false });

    const delOculto = await http().get(`/api/relojes/${oculto.urlAmigable}`).expect(404);
    const inexistente = await http().get("/api/relojes/no-existe-este-reloj").expect(404);

    const sinRuta = ({ body }: request.Response) => ({
      estado: body.estado,
      codigo: body.codigo,
      mensaje: body.mensaje,
    });
    expect(sinRuta(delOculto)).toEqual(sinRuta(inexistente));
  });

  it("las marcas del filtro son solo las que tienen relojes visibles, en orden alfabético", async () => {
    await crear({ nombre: "Marca con tilde", marcaNueva: "Órient Star" });
    await crear({ nombre: "Marca zeta", marcaNueva: "Zenith" });
    await crear({ nombre: "Marca oculta", marcaNueva: "Solo Oculta", visible: false });

    const marcas = (await http().get("/api/marcas").expect(200)).body as { nombre: string }[];
    const nombres = marcas.map((m) => m.nombre);

    expect(nombres).not.toContain("Solo Oculta");
    // En español la "Ó" se ordena con la "O", no al final como en el orden binario.
    expect(nombres.indexOf("Órient Star")).toBeLessThan(nombres.indexOf("Seiko"));
    expect(nombres.indexOf("Seiko")).toBeLessThan(nombres.indexOf("Zenith"));
  });

  it("las marcas del panel incluyen también las que solo tienen relojes ocultos", async () => {
    const marcas = (await http().get("/api/admin/marcas").set("Cookie", cookie).expect(200))
      .body as { nombre: string }[];

    expect(marcas.map((m) => m.nombre)).toContain("Solo Oculta");
  });
});

describe("editar un reloj (CU-14)", () => {
  it("cambia los datos y conserva la URL aunque cambie el nombre", async () => {
    const reloj = await crear({ nombre: "Antes del cambio" });

    const editado = await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send(datosReloj({ nombre: "Después del cambio", genero: "Mujer", garantia: "24 meses" }))
      .expect(200);

    expect(editado.body).toMatchObject({
      id: reloj.id,
      nombre: "Después del cambio",
      genero: "Mujer",
      garantia: "24 meses",
      urlAmigable: reloj.urlAmigable,
    });
    await http().get(`/api/relojes/${reloj.urlAmigable}`).expect(200);
  });

  it("registra el cambio de precio con quién lo hizo (SEF-5), y solo si cambió", async () => {
    const reloj = await crear({ precioCop: 1_000_000 });
    const guardar = (precioCop: number) =>
      http()
        .put(`/api/admin/relojes/${reloj.id}`)
        .set("Cookie", cookie)
        .send(datosReloj({ nombre: reloj.nombre, precioCop }))
        .expect(200);

    await guardar(1_000_000);
    await guardar(1_200_000);
    await guardar(1_200_000);

    const historial = await contexto.bd.query(
      "SELECT precio_anterior::int AS anterior, precio_nuevo::int AS nuevo, id_administrador AS admin FROM historial_precio WHERE id_reloj = $1",
      [reloj.id],
    );
    expect(historial).toEqual([{ anterior: 1_000_000, nuevo: 1_200_000, admin: idAdministrador }]);
  });

  it("reemplaza las fotos y la primera pasa a ser la principal", async () => {
    const reloj = await crear();

    const editado = await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send(datosReloj({ nombre: reloj.nombre, fotos: [fotos.nueva] }))
      .expect(200);

    expect(editado.body.imagenes).toEqual([
      expect.objectContaining({ archivo: fotos.nueva, orden: 1, esPrincipal: true }),
    ]);
  });

  it("conserva las mismas imágenes si las fotos no cambian", async () => {
    const reloj = await crear();

    const editado = await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send(datosReloj({ nombre: reloj.nombre, genero: "Unisex" }))
      .expect(200);

    expect(editado.body.imagenes.map((i: { id: number }) => i.id)).toEqual(
      (reloj.imagenes as { id: number }[]).map((i) => i.id),
    );
  });

  it("responde 404 si el reloj no existe", async () => {
    const respuesta = await http()
      .put("/api/admin/relojes/99999")
      .set("Cookie", cookie)
      .send(datosReloj())
      .expect(404);

    expect(respuesta.body.codigo).toBe("NO_ENCONTRADO");
  });

  it("cambia el modo sin abrir el formulario (CU-15)", async () => {
    const reloj = await crear({ cantidad: 3 });
    const cambiar = (modo: string) =>
      http().patch(`/api/admin/relojes/${reloj.id}/modo`).set("Cookie", cookie).send({ modo });

    const aBajoPedido = await cambiar("BAJO_PEDIDO").expect(200);
    const deVuelta = await cambiar("DISPONIBLE").expect(200);

    expect(aBajoPedido.body).toMatchObject({ modo: "BAJO_PEDIDO", cantidad: null });
    expect(deVuelta.body).toMatchObject({ modo: "DISPONIBLE", cantidad: 1, plazoEstimado: null });
    await cambiar("INVENTADO").expect(400);
  });

  it("oculta y muestra un reloj sin borrarlo (CU-16)", async () => {
    const reloj = await crear({ nombre: "Se oculta" });
    const cambiar = (visible: boolean) =>
      http()
        .patch(`/api/admin/relojes/${reloj.id}/visibilidad`)
        .set("Cookie", cookie)
        .send({ visible })
        .expect(200);

    await cambiar(false);
    await http().get(`/api/relojes/${reloj.urlAmigable}`).expect(404);
    await cambiar(true);
    await http().get(`/api/relojes/${reloj.urlAmigable}`).expect(200);
  });
});

describe("eliminar un reloj (CU-17, RN-8)", () => {
  async function conPedido(idReloj: number, numero: string) {
    await contexto.bd.query(
      `INSERT INTO pedido (numero_pedido, id_reloj, id_estado, id_ciudad, nombre_reloj, precio_reloj,
         modo_reloj, nombre_comprador, telefono_comprador, direccion, fecha_autorizacion_datos)
       VALUES ($1, $2, 1, 5001, 'Reloj', 3450000, 'DISPONIBLE', 'Ana', '3001234567', 'Calle 1', now())`,
      [numero, idReloj],
    );
  }

  it("lo elimina junto con sus fotos y su historial de precio", async () => {
    const reloj = await crear({ nombre: "Se elimina", precioCop: 1_000_000 });
    await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send(datosReloj({ nombre: "Se elimina", precioCop: 2_000_000 }))
      .expect(200);

    await http().delete(`/api/admin/relojes/${reloj.id}`).set("Cookie", cookie).expect(204);

    await http().get(`/api/admin/relojes/${reloj.id}`).set("Cookie", cookie).expect(404);
    expect(
      await contexto.bd.query("SELECT 1 FROM imagen_reloj WHERE id_reloj = $1", [reloj.id]),
    ).toEqual([]);
    expect(
      await contexto.bd.query("SELECT 1 FROM historial_precio WHERE id_reloj = $1", [reloj.id]),
    ).toEqual([]);
  });

  it("no lo elimina si tiene pedidos y deja intacto su historial de precio", async () => {
    const reloj = await crear({ nombre: "Con pedido", precioCop: 1_000_000 });
    await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send(datosReloj({ nombre: "Con pedido", precioCop: 2_000_000 }))
      .expect(200);
    await conPedido(reloj.id, "OMS-9001");

    const respuesta = await http()
      .delete(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .expect(409);

    expect(respuesta.body.codigo).toBe("TIENE_PEDIDOS");
    await http().get(`/api/admin/relojes/${reloj.id}`).set("Cookie", cookie).expect(200);
    expect(
      await contexto.bd.query("SELECT 1 FROM historial_precio WHERE id_reloj = $1", [reloj.id]),
    ).toHaveLength(1);
  });

  it("el panel sabe cuántos pedidos tiene cada reloj", async () => {
    const reloj = await crear({ nombre: "Cuenta pedidos" });
    await conPedido(reloj.id, "OMS-9002");
    await conPedido(reloj.id, "OMS-9003");

    const ficha = await http()
      .get(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .expect(200);
    const lista = (await http().get("/api/admin/relojes").set("Cookie", cookie).expect(200))
      .body as {
      id: number;
      cantidadPedidos: number;
    }[];

    expect(ficha.body.cantidadPedidos).toBe(2);
    expect(lista.find((r) => r.id === reloj.id)?.cantidadPedidos).toBe(2);
  });

  it("responde 404 si no existe", async () => {
    await http().delete("/api/admin/relojes/99999").set("Cookie", cookie).expect(404);
  });
});

describe("fotos del reloj", () => {
  it("rechaza una foto que nunca se subió", async () => {
    const respuesta = await http()
      .post("/api/admin/relojes")
      .set("Cookie", cookie)
      .send(datosReloj({ fotos: ["relojes/nunca-subida.png"] }))
      .expect(422);

    expect(respuesta.body.codigo).toBe("FOTO_NO_EXISTE");
  });

  it("borra del disco la foto que se quita de un reloj, y deja las demás", async () => {
    const quitada = await subirFoto(contexto, cookie);
    const reloj = await crear({ fotos: [fotos.principal, quitada] });

    await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send(datosReloj({ nombre: reloj.nombre as string, fotos: [fotos.principal] }))
      .expect(200);

    expect(await contexto.disco.exists(quitada)).toBe(false);
    expect(await contexto.disco.exists(fotos.principal)).toBe(true);
  });

  it("no borra una foto que otro reloj sigue usando", async () => {
    const compartida = await subirFoto(contexto, cookie);
    const a = await crear({ fotos: [compartida] });
    await crear({ fotos: [compartida] });

    await http().delete(`/api/admin/relojes/${a.id}`).set("Cookie", cookie).expect(204);

    expect(await contexto.disco.exists(compartida)).toBe(true);
  });

  it("borra las fotos de un reloj que se elimina", async () => {
    const propia = await subirFoto(contexto, cookie);
    const reloj = await crear({ fotos: [propia] });

    await http().delete(`/api/admin/relojes/${reloj.id}`).set("Cookie", cookie).expect(204);

    expect(await contexto.disco.exists(propia)).toBe(false);
  });
});

describe("el panel exige sesión (REQ-AUT-1)", () => {
  it.each([
    ["get", "/api/admin/relojes"],
    ["get", "/api/admin/relojes/1"],
    ["post", "/api/admin/relojes"],
    ["put", "/api/admin/relojes/1"],
    ["patch", "/api/admin/relojes/1/modo"],
    ["patch", "/api/admin/relojes/1/visibilidad"],
    ["delete", "/api/admin/relojes/1"],
    ["get", "/api/admin/marcas"],
  ] as const)("%s %s sin sesión responde 401", async (metodo, ruta) => {
    await http()[metodo](ruta).expect(401);
  });

  it("un id que no es un número se rechaza antes de tocar la base", async () => {
    await http().get("/api/admin/relojes/abc").set("Cookie", cookie).expect(400);
  });
});
