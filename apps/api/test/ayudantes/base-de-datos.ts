import { DataSource } from "typeorm";

import { opcionesBase } from "../../src/database/opciones.js";
import { ejecutarSeeds } from "../../src/database/seeds/ejecutar-seeds.js";
import { Administrador } from "../../src/modules/auth/entities/administrador.entity.js";
import { HistorialPrecio } from "../../src/modules/catalogo/entities/historial-precio.entity.js";
import { ImagenReloj } from "../../src/modules/catalogo/entities/imagen-reloj.entity.js";
import { Marca } from "../../src/modules/catalogo/entities/marca.entity.js";
import { Reloj } from "../../src/modules/catalogo/entities/reloj.entity.js";
import { EnlaceContacto } from "../../src/modules/contacto/entities/enlace-contacto.entity.js";
import { EstadoPedido } from "../../src/modules/pedidos/entities/estado-pedido.entity.js";
import { HistorialEstado } from "../../src/modules/pedidos/entities/historial-estado.entity.js";
import { NotaPedido } from "../../src/modules/pedidos/entities/nota-pedido.entity.js";
import { Pedido } from "../../src/modules/pedidos/entities/pedido.entity.js";
import { Ciudad } from "../../src/modules/ubicaciones/entities/ciudad.entity.js";
import { Departamento } from "../../src/modules/ubicaciones/entities/departamento.entity.js";

export const ENTIDADES = [
  Administrador,
  Marca,
  Reloj,
  ImagenReloj,
  HistorialPrecio,
  EnlaceContacto,
  Departamento,
  Ciudad,
  EstadoPedido,
  Pedido,
  HistorialEstado,
  NotaPedido,
];

/**
 * Deja la base de pruebas con el esquema recién migrado y los seeds cargados.
 * Borra todo lo que hubiera, así que solo acepta bases cuyo nombre termina en
 * `_test`: jamás debe correr contra la base de desarrollo.
 */
export async function crearBaseDePrueba() {
  const url = process.env.DATABASE_URL ?? "";
  const nombre = new URL(url).pathname.slice(1);
  if (!nombre.endsWith("_test")) {
    throw new Error(
      `Las pruebas de integración solo corren en una base cuyo nombre termine en "_test". Esta es "${nombre}".`,
    );
  }

  const dataSource = new DataSource({ ...opcionesBase, url, entities: ENTIDADES });
  await dataSource.initialize();
  await dataSource.query("DROP SCHEMA public CASCADE");
  await dataSource.query("CREATE SCHEMA public");
  await dataSource.runMigrations();
  await ejecutarSeeds(dataSource);
  return dataSource;
}

/** Código SQLSTATE de un error de PostgreSQL, o `undefined` si la promesa no falló. */
export async function codigoDeError(promesa: Promise<unknown>) {
  try {
    await promesa;
    return undefined;
  } catch (error) {
    return (error as { driverError?: { code?: string } }).driverError?.code;
  }
}

/** Códigos SQLSTATE que importan en estas pruebas. */
export const ERROR_PG = {
  /** Una restricción UNIQUE o un índice único se violó. */
  duplicado: "23505",
  /** Una clave foránea se violó. */
  claveForanea: "23503",
  /** Una restricción CHECK se violó. */
  restriccion: "23514",
  /** El valor no cabe en el tipo de la columna (por ejemplo, un varchar(10) con 11 caracteres). */
  valorMuyLargo: "22001",
} as const;
