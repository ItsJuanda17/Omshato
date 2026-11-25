import type { DataSource } from "typeorm";

import { ejecutarSeeds } from "../../src/database/seeds/ejecutar-seeds.js";
import { Administrador } from "../../src/modules/auth/entities/administrador.entity.js";
import { ImagenReloj } from "../../src/modules/catalogo/entities/imagen-reloj.entity.js";
import { Marca } from "../../src/modules/catalogo/entities/marca.entity.js";
import { Reloj } from "../../src/modules/catalogo/entities/reloj.entity.js";
import { ESTADOS_PEDIDO } from "../../src/modules/pedidos/estados-pedido.js";
import { EstadoPedido } from "../../src/modules/pedidos/entities/estado-pedido.entity.js";
import { HistorialEstado } from "../../src/modules/pedidos/entities/historial-estado.entity.js";
import { NotaPedido } from "../../src/modules/pedidos/entities/nota-pedido.entity.js";
import { Pedido } from "../../src/modules/pedidos/entities/pedido.entity.js";
import { Ciudad } from "../../src/modules/ubicaciones/entities/ciudad.entity.js";
import { Departamento } from "../../src/modules/ubicaciones/entities/departamento.entity.js";
import { codigoDeError, crearBaseDePrueba, ERROR_PG } from "../ayudantes/base-de-datos.js";

let ds: DataSource;
let contador = 0;

beforeAll(async () => {
  ds = await crearBaseDePrueba();
});

afterAll(async () => {
  await ds.destroy();
});

/** Un reloj válido con su marca. Cada llamada produce datos únicos. */
async function crearReloj(cambios: Partial<Reloj> = {}) {
  contador += 1;
  const marca = await ds.getRepository(Marca).save({ nombre: `Marca de prueba ${contador}` });
  return ds.getRepository(Reloj).save({
    idMarca: marca.id,
    nombre: `Reloj ${contador}`,
    genero: "Hombre",
    precioCop: 3_450_000,
    cantidad: 1,
    garantia: "12 meses",
    modo: "DISPONIBLE",
    urlAmigable: `reloj-${contador}`,
    ...cambios,
  });
}

async function crearAdministrador() {
  contador += 1;
  return ds.getRepository(Administrador).save({
    nombre: "Administrador de prueba",
    correo: `admin${contador}@omshato.test`,
    contrasenaHash: "hash-de-prueba",
  });
}

/** Un pedido válido para el reloj dado, en Medellín. */
function datosPedido(reloj: Reloj, cambios: Partial<Pedido> = {}): Partial<Pedido> {
  contador += 1;
  return {
    numeroPedido: `OMS-${String(contador).padStart(4, "0")}`,
    idReloj: reloj.id,
    idEstado: 1,
    idCiudad: 5001,
    nombreReloj: reloj.nombre,
    precioReloj: reloj.precioCop,
    modoReloj: reloj.modo,
    nombreComprador: "Ana María Pérez",
    telefonoComprador: "3001234567",
    direccion: "Calle 10 # 5-20",
    fechaAutorizacionDatos: new Date(),
    ...cambios,
  };
}

describe("migración y seeds", () => {
  it("crea las 12 tablas del modelo y la de sesiones", async () => {
    const filas: { tablename: string }[] = await ds.query(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations'",
    );

    expect(filas.map((f) => f.tablename).sort()).toEqual(
      [
        "administrador",
        "ciudad",
        "departamento",
        "enlace_contacto",
        "estado_pedido",
        "historial_estado",
        "historial_precio",
        "imagen_reloj",
        "marca",
        "nota_pedido",
        "pedido",
        "reloj",
        "sesion",
      ].sort(),
    );
  });

  it("carga los 6 estados del pedido con los ids de la aplicación", async () => {
    const estados = await ds.getRepository(EstadoPedido).find({ order: { id: "ASC" } });

    expect(estados).toEqual(ESTADOS_PEDIDO.map(({ id, nombre }) => ({ id, nombre })));
  });

  it("carga los 33 departamentos y los 1.122 municipios de DIVIPOLA", async () => {
    expect(await ds.getRepository(Departamento).count()).toBe(33);
    expect(await ds.getRepository(Ciudad).count()).toBe(1122);
  });

  it("cada ciudad pertenece al departamento de los dos primeros dígitos de su código", async () => {
    const [{ incoherentes }] = await ds.query(
      `SELECT count(*)::int AS incoherentes FROM ciudad c
       JOIN departamento d ON d.id_departamento = c.id_departamento
       WHERE left(c.codigo_dane, 2) <> d.codigo_dane OR c.id_ciudad <> c.codigo_dane::int`,
    );

    expect(incoherentes).toBe(0);
  });

  it("guarda Medellín y Bogotá con sus nombres y departamentos", async () => {
    const medellin = await ds.getRepository(Ciudad).findOneOrFail({
      where: { id: 5001 },
      relations: { departamento: true },
    });
    const bogota = await ds.getRepository(Ciudad).findOneByOrFail({ id: 11001 });

    expect(medellin.nombre).toBe("Medellín");
    expect(medellin.departamento.nombre).toBe("Antioquia");
    expect(bogota.nombre).toBe("Bogotá, D.C.");
  });

  it("los seeds se pueden repetir sin duplicar ni romper nada", async () => {
    const resumen = await ejecutarSeeds(ds);

    expect(resumen).toEqual({
      estadosPedido: 6,
      departamentos: 33,
      ciudades: 1122,
      enlacesContacto: 3,
    });
    expect(await ds.getRepository(Ciudad).count()).toBe(1122);
    expect(await ds.getRepository(EstadoPedido).count()).toBe(6);
  });
});

describe("reglas del esquema", () => {
  it("rechaza un precio en cero o negativo (REQ-ADM-3)", async () => {
    for (const precio of [0, -1]) {
      const resultado = codigoDeError(crearReloj({ precioCop: precio }));
      expect(await resultado).toBe(ERROR_PG.restriccion);
    }
  });

  it("rechaza un modo que no sea Disponible o Bajo pedido (RN-1)", async () => {
    const resultado = codigoDeError(crearReloj({ modo: "AGOTADO" as Reloj["modo"] }));

    expect(await resultado).toBe(ERROR_PG.restriccion);
  });

  it("no permite dos relojes con la misma URL amigable (REQ-CAT-7)", async () => {
    const reloj = await crearReloj();

    const resultado = codigoDeError(crearReloj({ urlAmigable: reloj.urlAmigable }));

    expect(await resultado).toBe(ERROR_PG.duplicado);
  });

  it("solo permite una foto principal por reloj (REQ-ADM-10)", async () => {
    const reloj = await crearReloj();
    const imagenes = ds.getRepository(ImagenReloj);
    await imagenes.save({ idReloj: reloj.id, archivo: "a.webp", orden: 1, esPrincipal: true });

    const segundaPrincipal = codigoDeError(
      imagenes.save({ idReloj: reloj.id, archivo: "b.webp", orden: 2, esPrincipal: true }),
    );
    const noPrincipal = codigoDeError(
      imagenes.save({ idReloj: reloj.id, archivo: "c.webp", orden: 3, esPrincipal: false }),
    );

    expect(await segundaPrincipal).toBe(ERROR_PG.duplicado);
    expect(await noPrincipal).toBeUndefined();
  });

  it("no permite repetir la posición de una foto", async () => {
    const reloj = await crearReloj();
    const imagenes = ds.getRepository(ImagenReloj);
    await imagenes.save({ idReloj: reloj.id, archivo: "a.webp", orden: 1 });

    const resultado = codigoDeError(
      imagenes.save({ idReloj: reloj.id, archivo: "b.webp", orden: 1 }),
    );

    expect(await resultado).toBe(ERROR_PG.duplicado);
  });

  it("rechaza un pedido con un teléfono que no tiene 10 dígitos (REQ-PED-3)", async () => {
    const reloj = await crearReloj();
    const pedidos = ds.getRepository(Pedido);

    const casos = [
      ["30012345", ERROR_PG.restriccion],
      // Con 11 dígitos ya no cabe en la columna: PostgreSQL lo rechaza antes del CHECK.
      ["30012345678", ERROR_PG.valorMuyLargo],
      ["300123456a", ERROR_PG.restriccion],
    ] as const;

    for (const [telefono, codigoEsperado] of casos) {
      const resultado = codigoDeError(
        pedidos.save(datosPedido(reloj, { telefonoComprador: telefono })),
      );
      expect(await resultado).toBe(codigoEsperado);
    }
  });

  it("rechaza un pedido con nombre o dirección en blanco (REQ-PED-4)", async () => {
    const reloj = await crearReloj();
    const pedidos = ds.getRepository(Pedido);

    const sinNombre = codigoDeError(pedidos.save(datosPedido(reloj, { nombreComprador: "   " })));
    const sinDireccion = codigoDeError(pedidos.save(datosPedido(reloj, { direccion: "" })));

    expect(await sinNombre).toBe(ERROR_PG.restriccion);
    expect(await sinDireccion).toBe(ERROR_PG.restriccion);
  });

  it("no permite eliminar un reloj que tiene pedidos (RN-8)", async () => {
    const reloj = await crearReloj();
    await ds.getRepository(Pedido).save(datosPedido(reloj));

    const resultado = codigoDeError(ds.getRepository(Reloj).delete(reloj.id));

    expect(await resultado).toBe(ERROR_PG.claveForanea);
    expect(await ds.getRepository(Reloj).existsBy({ id: reloj.id })).toBe(true);
  });

  it("al eliminar un reloj sin pedidos se borran sus fotos", async () => {
    const reloj = await crearReloj();
    await ds.getRepository(ImagenReloj).save({ idReloj: reloj.id, archivo: "a.webp", orden: 1 });

    await ds.getRepository(Reloj).delete(reloj.id);

    expect(await ds.getRepository(ImagenReloj).countBy({ idReloj: reloj.id })).toBe(0);
  });

  it("no registra dos veces la misma clave de idempotencia (REQ-PED-12)", async () => {
    const reloj = await crearReloj();
    const pedidos = ds.getRepository(Pedido);
    await pedidos.save(datosPedido(reloj, { claveIdempotencia: "clave-unica-123" }));

    const resultado = codigoDeError(
      pedidos.save(datosPedido(reloj, { claveIdempotencia: "clave-unica-123" })),
    );

    expect(await resultado).toBe(ERROR_PG.duplicado);
  });

  it("al eliminar un pedido se borran su historial y sus notas", async () => {
    const reloj = await crearReloj();
    const admin = await crearAdministrador();
    const pedido = await ds.getRepository(Pedido).save(datosPedido(reloj));
    await ds.getRepository(HistorialEstado).save({ idPedido: pedido.id, idEstado: 1 });
    await ds.getRepository(NotaPedido).save({
      idPedido: pedido.id,
      idAdministrador: admin.id,
      texto: "Nota",
    });

    await ds.getRepository(Pedido).delete(pedido.id);

    expect(await ds.getRepository(HistorialEstado).countBy({ idPedido: pedido.id })).toBe(0);
    expect(await ds.getRepository(NotaPedido).countBy({ idPedido: pedido.id })).toBe(0);
  });
});

describe("entidades", () => {
  it("devuelve el precio como número y las fechas como Date", async () => {
    const reloj = await crearReloj({ precioCop: 12_100_000 });

    const leido = await ds.getRepository(Reloj).findOneByOrFail({ id: reloj.id });

    expect(leido.precioCop).toBe(12_100_000);
    expect(typeof leido.precioCop).toBe("number");
    expect(leido.fechaPublicacion).toBeInstanceOf(Date);
    expect(leido.visible).toBe(true);
  });

  it("mapea las propiedades en camelCase a columnas en snake_case", async () => {
    const reloj = await crearReloj({ plazoEstimado: "8 a 12 días hábiles" });

    const [fila] = await ds.query(
      `SELECT url_amigable, plazo_estimado, precio_cop, fecha_publicacion
       FROM reloj WHERE id_reloj = $1`,
      [reloj.id],
    );

    expect(fila.url_amigable).toBe(reloj.urlAmigable);
    expect(fila.plazo_estimado).toBe("8 a 12 días hábiles");
    expect(fila.precio_cop).toBe("3450000");
  });

  it("carga un reloj con su marca y sus fotos", async () => {
    const reloj = await crearReloj();
    await ds.getRepository(ImagenReloj).save([
      { idReloj: reloj.id, archivo: "a.webp", orden: 1, esPrincipal: true },
      { idReloj: reloj.id, archivo: "b.webp", orden: 2 },
    ]);

    const leido = await ds.getRepository(Reloj).findOneOrFail({
      where: { id: reloj.id },
      relations: { marca: true, imagenes: true },
      order: { imagenes: { orden: "ASC" } },
    });

    expect(leido.marca.id).toBe(reloj.idMarca);
    expect(leido.imagenes.map((i) => i.archivo)).toEqual(["a.webp", "b.webp"]);
  });

  it("guarda y lee un pedido con su reloj, ciudad, estado, historial y notas", async () => {
    const reloj = await crearReloj({ modo: "BAJO_PEDIDO", cantidad: null });
    const admin = await crearAdministrador();
    const pedido = await ds
      .getRepository(Pedido)
      .save(datosPedido(reloj, { idEstado: 2, claveIdempotencia: "otra-clave-456" }));
    await ds.getRepository(HistorialEstado).save([
      { idPedido: pedido.id, idEstado: 2, idAdministrador: null },
      { idPedido: pedido.id, idEstado: 3, idAdministrador: admin.id },
    ]);
    await ds.getRepository(NotaPedido).save({
      idPedido: pedido.id,
      idAdministrador: admin.id,
      texto: "Plazo acordado con el proveedor: 8 días.",
    });

    const leido = await ds.getRepository(Pedido).findOneOrFail({
      where: { id: pedido.id },
      relations: {
        reloj: true,
        ciudad: { departamento: true },
        estado: true,
        historial: true,
        notas: true,
      },
      order: { historial: { id: "ASC" } },
    });

    expect(leido.reloj.id).toBe(reloj.id);
    expect(leido.ciudad.nombre).toBe("Medellín");
    expect(leido.ciudad.departamento.nombre).toBe("Antioquia");
    expect(leido.estado.nombre).toBe("Por conseguir con proveedor");
    expect(leido.precioReloj).toBe(3_450_000);
    expect(leido.modoReloj).toBe("BAJO_PEDIDO");
    expect(leido.motivoCancelacion).toBeNull();
    expect(leido.fechaAutorizacionDatos).toBeInstanceOf(Date);
    // La fila inicial del historial la registra el sistema, sin administrador.
    expect(leido.historial.map((h) => h.idAdministrador)).toEqual([null, admin.id]);
    expect(leido.notas).toHaveLength(1);
  });

  it("el pedido conserva el nombre y el precio aunque el reloj cambie (RN-7)", async () => {
    const reloj = await crearReloj();
    const pedido = await ds.getRepository(Pedido).save(datosPedido(reloj));

    await ds
      .getRepository(Reloj)
      .update(reloj.id, { nombre: "Nombre nuevo", precioCop: 9_999_999 });
    const leido = await ds.getRepository(Pedido).findOneByOrFail({ id: pedido.id });

    expect(leido.nombreReloj).toBe(reloj.nombre);
    expect(leido.precioReloj).toBe(3_450_000);
  });
});

describe("reversión de la migración", () => {
  // Va al final: borra el esquema y lo deja listo otra vez.
  it("se puede revertir y volver a aplicar", async () => {
    // Una migración por vez: primero las sesiones, después el esquema inicial.
    await ds.undoLastMigration();
    expect(await ds.query("SELECT to_regclass('sesion') AS tabla")).toEqual([{ tabla: null }]);
    await ds.undoLastMigration();
    const [{ restantes }] = await ds.query(
      "SELECT count(*)::int AS restantes FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'migrations'",
    );
    expect(restantes).toBe(0);

    await ds.runMigrations();
    await ejecutarSeeds(ds);

    expect(await ds.getRepository(Ciudad).count()).toBe(1122);
  });
});
