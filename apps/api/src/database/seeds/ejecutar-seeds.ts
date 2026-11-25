import type { DataSource, EntityManager } from "typeorm";

import { ESTADOS_PEDIDO } from "../../modules/pedidos/estados-pedido.js";
import { DEPARTAMENTOS_DIVIPOLA, MUNICIPIOS_DIVIPOLA } from "./datos/divipola.js";

export interface ResumenSeeds {
  estadosPedido: number;
  departamentos: number;
  ciudades: number;
}

/** Los 6 estados del pedido, con los ids que usa la aplicación. */
async function sembrarEstadosPedido(manager: EntityManager) {
  await manager.query(
    `INSERT INTO estado_pedido (id_estado, nombre)
     SELECT * FROM unnest($1::smallint[], $2::varchar[])
     ON CONFLICT (id_estado) DO UPDATE SET nombre = EXCLUDED.nombre`,
    [ESTADOS_PEDIDO.map((e) => e.id), ESTADOS_PEDIDO.map((e) => e.nombre)],
  );
  return ESTADOS_PEDIDO.length;
}

/** Departamentos y municipios de Colombia (DIVIPOLA). El id es el código DANE como número. */
async function sembrarUbicaciones(manager: EntityManager) {
  await manager.query(
    `INSERT INTO departamento (id_departamento, codigo_dane, nombre)
     SELECT * FROM unnest($1::smallint[], $2::char(2)[], $3::varchar[])
     ON CONFLICT (id_departamento) DO UPDATE
       SET codigo_dane = EXCLUDED.codigo_dane, nombre = EXCLUDED.nombre`,
    [
      DEPARTAMENTOS_DIVIPOLA.map(([codigo]) => Number(codigo)),
      DEPARTAMENTOS_DIVIPOLA.map(([codigo]) => codigo),
      DEPARTAMENTOS_DIVIPOLA.map(([, nombre]) => nombre),
    ],
  );

  await manager.query(
    `INSERT INTO ciudad (id_ciudad, id_departamento, codigo_dane, nombre)
     SELECT * FROM unnest($1::integer[], $2::smallint[], $3::char(5)[], $4::varchar[])
     ON CONFLICT (id_ciudad) DO UPDATE
       SET id_departamento = EXCLUDED.id_departamento,
           codigo_dane = EXCLUDED.codigo_dane,
           nombre = EXCLUDED.nombre`,
    [
      MUNICIPIOS_DIVIPOLA.map(([codigo]) => Number(codigo)),
      MUNICIPIOS_DIVIPOLA.map(([codigo]) => Number(codigo.slice(0, 2))),
      MUNICIPIOS_DIVIPOLA.map(([codigo]) => codigo),
      MUNICIPIOS_DIVIPOLA.map(([, nombre]) => nombre),
    ],
  );

  return { departamentos: DEPARTAMENTOS_DIVIPOLA.length, ciudades: MUNICIPIOS_DIVIPOLA.length };
}

/**
 * Carga los datos base. Se puede correr las veces que haga falta: si un dato ya
 * existe lo actualiza, y todo ocurre en una sola transacción.
 */
export async function ejecutarSeeds(dataSource: DataSource): Promise<ResumenSeeds> {
  return dataSource.transaction(async (manager) => {
    const estadosPedido = await sembrarEstadosPedido(manager);
    const ubicaciones = await sembrarUbicaciones(manager);
    return { estadosPedido, ...ubicaciones };
  });
}
