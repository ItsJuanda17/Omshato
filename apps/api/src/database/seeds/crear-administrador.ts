import dataSource from "../data-source.js";
import { esquemaAdministrador, registrarAdministrador } from "./administrador.js";

/**
 * Punto de entrada de `pnpm admin:crear`. Lee `ADMIN_CORREO`, `ADMIN_NOMBRE` (opcional)
 * y `ADMIN_CONTRASENA` del entorno, no de argumentos: así la contraseña no queda en el
 * historial de la terminal ni en la lista de procesos.
 */
const datos = esquemaAdministrador.safeParse({
  correo: process.env.ADMIN_CORREO,
  nombre: process.env.ADMIN_NOMBRE ?? "Administrador",
  contrasena: process.env.ADMIN_CONTRASENA,
});

if (!datos.success) {
  console.error("No se pudo crear el administrador:");
  for (const { path, message } of datos.error.issues) {
    console.error(`  - ${path.join(".") || "datos"}: ${message}`);
  }
  console.error("Define ADMIN_CORREO, ADMIN_CONTRASENA y, si quieres, ADMIN_NOMBRE.");
  process.exit(1);
}

await dataSource.initialize();
try {
  const resultado = await registrarAdministrador(dataSource, datos.data);
  console.log(`Cuenta ${resultado}: ${datos.data.correo.trim().toLowerCase()}`);
} finally {
  await dataSource.destroy();
}
