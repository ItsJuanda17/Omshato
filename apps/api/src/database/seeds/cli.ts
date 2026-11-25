import dataSource from "../data-source.js";
import { ejecutarSeeds } from "./ejecutar-seeds.js";

/** Punto de entrada de `pnpm seed`. */
await dataSource.initialize();
try {
  const resumen = await ejecutarSeeds(dataSource);
  console.log(
    `Seeds listos: ${resumen.estadosPedido} estados de pedido, ` +
      `${resumen.departamentos} departamentos, ${resumen.ciudades} ciudades y ` +
      `${resumen.enlacesContacto} enlaces de contacto.`,
  );
} finally {
  await dataSource.destroy();
}
