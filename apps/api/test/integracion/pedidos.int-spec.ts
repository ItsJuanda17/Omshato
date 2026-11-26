import { randomUUID } from "node:crypto";
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
let foto: string;
let contador = 0;

beforeAll(async () => {
  contexto = await crearAppConBaseDeDatos();
  ({ cookie, idAdministrador } = await sesionDeAdministrador(contexto));
  foto = await subirFoto(contexto, cookie);
});

afterAll(async () => {
  await contexto.cerrar();
});

const http = () => request(contexto.app.getHttpServer());

async function crearReloj(cambios: Record<string, unknown> = {}) {
  contador += 1;
  const respuesta = await http()
    .post("/api/admin/relojes")
    .set("Cookie", cookie)
    .send({
      nombre: `Reloj de pedido ${contador}`,
      marcaNueva: "Seiko",
      genero: "Hombre",
      precioCop: 3_450_000,
      modo: "DISPONIBLE",
      cantidad: 2,
      garantia: "12 meses",
      visible: true,
      fotos: [foto],
      ...cambios,
    })
    .expect(201);
  return respuesta.body as { id: number; nombre: string; marca: { nombre: string } };
}

/** Lo que enviaría el formulario público. Cada llamada usa una clave de envío nueva. */
function datosPedido(idReloj: number, cambios: Record<string, unknown> = {}) {
  return {
    idReloj,
    nombreComprador: "Ana María Pérez",
    telefonoComprador: "3001234567",
    idCiudad: 5001,
    direccion: "Calle 10 # 20-30, apto 301",
    aceptaPolitica: true,
    claveIdempotencia: randomUUID(),
    ...cambios,
  };
}

async function hacerPedido(idReloj: number, cambios: Record<string, unknown> = {}) {
  const respuesta = await http()
    .post("/api/pedidos")
    .send(datosPedido(idReloj, cambios))
    .expect(201);
  return respuesta.body as {
    id: number;
    numeroPedido: string;
    estado: string;
    [clave: string]: unknown;
  };
}

describe("hacer un pedido sin registro (CU-04)", () => {
  it("lo registra con el reloj, la ciudad y su estado inicial, sin pedir sesión", async () => {
    const reloj = await crearReloj({ nombre: "Presage" });

    const pedido = await hacerPedido(reloj.id);

    expect(pedido).toMatchObject({
      numeroPedido: expect.stringMatching(/^OMS-\d{4,}$/),
      idReloj: reloj.id,
      estado: "RECIBIDO",
      nombreReloj: "Seiko Presage",
      precioReloj: 3_450_000,
      modoReloj: "DISPONIBLE",
      nombreComprador: "Ana María Pérez",
      telefonoComprador: "3001234567",
      direccion: "Calle 10 # 20-30, apto 301",
      motivoCancelacion: null,
      departamento: { id: 5, nombre: "Antioquia" },
      ciudad: { id: 5001, idDepartamento: 5, nombre: "Medellín" },
    });
    expect(pedido.historial).toEqual([
      expect.objectContaining({ estado: "RECIBIDO", idAdministrador: null }),
    ]);
  });

  it("no devuelve las notas internas al comprador", async () => {
    const reloj = await crearReloj();

    const pedido = await hacerPedido(reloj.id);

    expect(pedido).not.toHaveProperty("notas");
    expect(pedido).not.toHaveProperty("claveIdempotencia");
  });

  it("un reloj Bajo pedido nace en «Por conseguir con proveedor» (REQ-PED-9)", async () => {
    const reloj = await crearReloj({ modo: "BAJO_PEDIDO", cantidad: null });

    const pedido = await hacerPedido(reloj.id);

    expect(pedido).toMatchObject({
      estado: "POR_CONSEGUIR_CON_PROVEEDOR",
      modoReloj: "BAJO_PEDIDO",
    });
  });

  it("numera los pedidos en orden y sin repetir, aunque lleguen a la vez (REQ-PED-8)", async () => {
    const reloj = await crearReloj();

    const pedidos = await Promise.all(Array.from({ length: 6 }, () => hacerPedido(reloj.id)));
    const numeros = pedidos.map((p) => p.numeroPedido);

    expect(new Set(numeros).size).toBe(6);
    expect(numeros.every((n) => /^OMS-\d{4,}$/.test(n))).toBe(true);
  });

  it("guarda la fecha de la autorización de datos que pone el servidor (REQ-PED-6)", async () => {
    const reloj = await crearReloj();
    const antes = Date.now();

    const pedido = await hacerPedido(reloj.id);

    const fecha = new Date(pedido.fechaAutorizacionDatos as string).getTime();
    expect(fecha).toBeGreaterThanOrEqual(antes - 1000);
    expect(fecha).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it("el mismo envío repetido devuelve el pedido ya registrado, sin crear otro (REQ-PED-12)", async () => {
    const reloj = await crearReloj();
    const datos = datosPedido(reloj.id);

    const primero = await http().post("/api/pedidos").send(datos).expect(201);
    const repetido = await http().post("/api/pedidos").send(datos).expect(200);

    expect(repetido.body.id).toBe(primero.body.id);
    expect(repetido.body.numeroPedido).toBe(primero.body.numeroPedido);
    expect(
      await contexto.bd.query("SELECT 1 FROM pedido WHERE id_reloj = $1", [reloj.id]),
    ).toHaveLength(1);
  });

  it("dos envíos idénticos a la vez crean un solo pedido", async () => {
    const reloj = await crearReloj();
    const datos = datosPedido(reloj.id);

    const [a, b] = await Promise.all([
      http().post("/api/pedidos").send(datos),
      http().post("/api/pedidos").send(datos),
    ]);

    expect([a.status, b.status].toSorted((a, b) => a - b)).toEqual([200, 201]);
    expect(a.body.id).toBe(b.body.id);
    expect(
      await contexto.bd.query("SELECT 1 FROM pedido WHERE id_reloj = $1", [reloj.id]),
    ).toHaveLength(1);
  });

  it("conserva el nombre y el precio aunque el reloj cambie después (RN-7)", async () => {
    const reloj = await crearReloj({ nombre: "Antes", precioCop: 1_000_000 });
    const pedido = await hacerPedido(reloj.id);

    await http()
      .put(`/api/admin/relojes/${reloj.id}`)
      .set("Cookie", cookie)
      .send({
        nombre: "Después",
        marcaNueva: "Seiko",
        genero: "Hombre",
        precioCop: 9_999_000,
        modo: "DISPONIBLE",
        cantidad: 2,
        garantia: "12 meses",
        visible: true,
        fotos: [foto],
      })
      .expect(200);

    const guardado = await http()
      .get(`/api/admin/pedidos/${pedido.id}`)
      .set("Cookie", cookie)
      .expect(200);
    expect(guardado.body).toMatchObject({ nombreReloj: "Seiko Antes", precioReloj: 1_000_000 });
  });
});

describe("rechazos al hacer un pedido", () => {
  it("no se puede pedir un reloj oculto ni uno que no existe (REQ-PED-11)", async () => {
    const oculto = await crearReloj({ visible: false });

    const delOculto = await http().post("/api/pedidos").send(datosPedido(oculto.id)).expect(409);
    const inexistente = await http().post("/api/pedidos").send(datosPedido(99_999)).expect(409);

    expect(delOculto.body.codigo).toBe("RELOJ_NO_DISPONIBLE");
    expect(inexistente.body.codigo).toBe("RELOJ_NO_DISPONIBLE");
    expect(delOculto.body.mensaje).toBe(inexistente.body.mensaje);
  });

  it("un pedido rechazado no deja ninguna fila", async () => {
    const oculto = await crearReloj({ visible: false });

    await http().post("/api/pedidos").send(datosPedido(oculto.id)).expect(409);

    expect(
      await contexto.bd.query("SELECT 1 FROM pedido WHERE id_reloj = $1", [oculto.id]),
    ).toEqual([]);
  });

  it("rechaza una ciudad que no existe", async () => {
    const reloj = await crearReloj();

    const respuesta = await http()
      .post("/api/pedidos")
      .send(datosPedido(reloj.id, { idCiudad: 1 }))
      .expect(422);

    expect(respuesta.body.codigo).toBe("CIUDAD_NO_EXISTE");
  });

  it.each([
    ["sin aceptar la política (REQ-PED-6)", { aceptaPolitica: false }, "aceptaPolitica"],
    ["sin nombre", { nombreComprador: "  " }, "nombreComprador"],
    [
      "con un teléfono de 9 dígitos (REQ-PED-3)",
      { telefonoComprador: "300123456" },
      "telefonoComprador",
    ],
    ["con un teléfono con letras", { telefonoComprador: "300123456a" }, "telefonoComprador"],
    ["con un teléfono con espacios", { telefonoComprador: "300 123 4567" }, "telefonoComprador"],
    ["sin dirección", { direccion: "" }, "direccion"],
    ["con una dirección de más de 250 caracteres", { direccion: "x".repeat(251) }, "direccion"],
    ["con una clave de envío corta", { claveIdempotencia: "corta" }, "claveIdempotencia"],
  ])("rechaza un pedido %s", async (_caso, cambios, campo) => {
    const reloj = await crearReloj();

    const respuesta = await http()
      .post("/api/pedidos")
      .send(datosPedido(reloj.id, cambios))
      .expect(400);

    expect(respuesta.body.codigo).toBe("DATOS_INVALIDOS");
    expect(respuesta.body.detalles.map((d: { campo: string }) => d.campo)).toContain(campo);
  });
});

describe("gestión de pedidos (panel)", () => {
  it("lista los pedidos del más reciente al más antiguo, con historial y notas (REQ-GPE-1)", async () => {
    const reloj = await crearReloj();
    const primero = await hacerPedido(reloj.id);
    const segundo = await hacerPedido(reloj.id);

    const lista = (await http().get("/api/admin/pedidos").set("Cookie", cookie).expect(200))
      .body as {
      id: number;
      notas: unknown[];
      historial: unknown[];
    }[];
    const posiciones = [segundo.id, primero.id].map((id) => lista.findIndex((p) => p.id === id));

    expect(posiciones[0]).toBeGreaterThanOrEqual(0);
    expect(posiciones[0]).toBeLessThan(posiciones[1]);
    expect(lista[posiciones[0]]).toMatchObject({ notas: [], historial: [expect.anything()] });
  });

  it("muestra el detalle de un pedido o 404 si no existe (REQ-GPE-3)", async () => {
    const reloj = await crearReloj();
    const pedido = await hacerPedido(reloj.id);

    const detalle = await http()
      .get(`/api/admin/pedidos/${pedido.id}`)
      .set("Cookie", cookie)
      .expect(200);
    const inexistente = await http()
      .get("/api/admin/pedidos/99999")
      .set("Cookie", cookie)
      .expect(404);

    expect(detalle.body.numeroPedido).toBe(pedido.numeroPedido);
    expect(inexistente.body.codigo).toBe("NO_ENCONTRADO");
  });

  describe("cambiar el estado (CU-20)", () => {
    const cambiar = (id: number, cuerpo: Record<string, unknown>) =>
      http().post(`/api/admin/pedidos/${id}/estado`).set("Cookie", cookie).send(cuerpo);

    it("recorre el camino completo y deja en el historial quién y cuándo (REQ-GPE-7)", async () => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);

      await cambiar(pedido.id, { estado: "CONFIRMADO" }).expect(201);
      await cambiar(pedido.id, { estado: "ENVIADO" }).expect(201);
      const final = await cambiar(pedido.id, { estado: "ENTREGADO" }).expect(201);

      expect(final.body.estado).toBe("ENTREGADO");
      expect(final.body.historial.map((h: { estado: string }) => h.estado)).toEqual([
        "RECIBIDO",
        "CONFIRMADO",
        "ENVIADO",
        "ENTREGADO",
      ]);
      expect(final.body.historial[0].idAdministrador).toBeNull();
      expect(final.body.historial[3].idAdministrador).toBe(idAdministrador);
    });

    it.each([
      ["RECIBIDO", "ENVIADO"],
      ["RECIBIDO", "ENTREGADO"],
      ["RECIBIDO", "RECIBIDO"],
    ])("no deja pasar de %s a %s (REQ-GPE-5)", async (_desde, hacia) => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);

      const respuesta = await cambiar(pedido.id, { estado: hacia }).expect(409);

      expect(respuesta.body.codigo).toBe("TRANSICION_NO_PERMITIDA");
      expect(respuesta.body.mensaje).toContain("«Recibido»");
    });

    it("«Por conseguir con proveedor» solo pasa a Confirmado o Cancelado", async () => {
      const reloj = await crearReloj({ modo: "BAJO_PEDIDO", cantidad: null });
      const pedido = await hacerPedido(reloj.id);

      await cambiar(pedido.id, { estado: "ENVIADO" }).expect(409);
      await cambiar(pedido.id, { estado: "CONFIRMADO" }).expect(201);
    });

    it("exige un motivo para cancelar y lo guarda (REQ-GPE-6)", async () => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);

      const sinMotivo = await cambiar(pedido.id, { estado: "CANCELADO", motivo: "  " }).expect(400);
      const cancelado = await cambiar(pedido.id, {
        estado: "CANCELADO",
        motivo: "El cliente ya no lo quiere",
      }).expect(201);

      expect(sinMotivo.body.detalles[0].campo).toBe("motivo");
      expect(cancelado.body).toMatchObject({
        estado: "CANCELADO",
        motivoCancelacion: "El cliente ya no lo quiere",
      });
    });

    it("no se puede cancelar un pedido ya enviado, y Entregado y Cancelado son finales", async () => {
      const reloj = await crearReloj();
      const enviado = await hacerPedido(reloj.id);
      await cambiar(enviado.id, { estado: "CONFIRMADO" }).expect(201);
      await cambiar(enviado.id, { estado: "ENVIADO" }).expect(201);
      const cancelado = await hacerPedido(reloj.id);
      await cambiar(cancelado.id, { estado: "CANCELADO", motivo: "Prueba" }).expect(201);

      await cambiar(enviado.id, { estado: "CANCELADO", motivo: "Tarde" }).expect(409);
      await cambiar(cancelado.id, { estado: "CONFIRMADO" }).expect(409);
    });

    it("rechaza un estado que no existe y un pedido que no existe", async () => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);

      await cambiar(pedido.id, { estado: "INVENTADO" }).expect(400);
      await cambiar(99_999, { estado: "CONFIRMADO" }).expect(404);
    });

    it("el mismo cambio pedido dos veces a la vez se aplica una sola vez", async () => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);

      // Sin el bloqueo de la fila, los dos verían «Recibido» y los dos escribirían el historial.
      const [a, b] = await Promise.all([
        cambiar(pedido.id, { estado: "CONFIRMADO" }),
        cambiar(pedido.id, { estado: "CONFIRMADO" }),
      ]);

      expect([a.status, b.status].toSorted((a, b) => a - b)).toEqual([201, 409]);
      const historial = await contexto.bd.query(
        "SELECT 1 FROM historial_estado WHERE id_pedido = $1",
        [pedido.id],
      );
      expect(historial).toHaveLength(2);
    });
  });

  describe("notas internas (CU-22)", () => {
    it("agrega notas con quién las escribió y el comprador no las ve (REQ-GPE-11)", async () => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);

      const respuesta = await http()
        .post(`/api/admin/pedidos/${pedido.id}/notas`)
        .set("Cookie", cookie)
        .send({ texto: "  Llamar antes de las 5 pm  " })
        .expect(201);
      await http()
        .post(`/api/admin/pedidos/${pedido.id}/notas`)
        .set("Cookie", cookie)
        .send({ texto: "Segunda nota" })
        .expect(201);

      expect(respuesta.body.notas).toEqual([
        expect.objectContaining({ texto: "Llamar antes de las 5 pm", idAdministrador }),
      ]);
      const detalle = await http()
        .get(`/api/admin/pedidos/${pedido.id}`)
        .set("Cookie", cookie)
        .expect(200);
      expect(detalle.body.notas.map((n: { texto: string }) => n.texto)).toEqual([
        "Llamar antes de las 5 pm",
        "Segunda nota",
      ]);
    });

    it("no filtra las notas cuando el comprador repite el envío", async () => {
      const reloj = await crearReloj();
      const datos = datosPedido(reloj.id);
      const pedido = (await http().post("/api/pedidos").send(datos).expect(201)).body;
      await http()
        .post(`/api/admin/pedidos/${pedido.id}/notas`)
        .set("Cookie", cookie)
        .send({ texto: "Nota privada" })
        .expect(201);

      const repetido = await http().post("/api/pedidos").send(datos).expect(200);

      expect(JSON.stringify(repetido.body)).not.toContain("Nota privada");
    });

    it("rechaza una nota vacía o demasiado larga y un pedido que no existe", async () => {
      const reloj = await crearReloj();
      const pedido = await hacerPedido(reloj.id);
      const agregar = (id: number, texto: string) =>
        http().post(`/api/admin/pedidos/${id}/notas`).set("Cookie", cookie).send({ texto });

      await agregar(pedido.id, "   ").expect(400);
      await agregar(pedido.id, "x".repeat(1001)).expect(400);
      await agregar(99_999, "Hola").expect(404);
    });
  });
});

describe("el panel de pedidos exige sesión (REQ-AUT-1)", () => {
  it.each([
    ["get", "/api/admin/pedidos"],
    ["get", "/api/admin/pedidos/1"],
    ["post", "/api/admin/pedidos/1/estado"],
    ["post", "/api/admin/pedidos/1/notas"],
  ] as const)("%s %s sin sesión responde 401", async (metodo, ruta) => {
    await http()[metodo](ruta).expect(401);
  });
});
