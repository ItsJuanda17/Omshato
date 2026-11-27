// Prueba de navegador de punta a punta: `pnpm test:navegador`.
//
// Crea una base propia (`omshato_e2e`, se borra y se vuelve a crear en cada corrida), le carga el
// esquema, los datos base, dos cuentas de administrador y la demostración, levanta el API y el
// sitio en modo producción en puertos propios (3101 y 3100) y recorre todo con Chrome headless.
// No toca la base de desarrollo. Requiere PostgreSQL arriba (`pnpm db:up`) y Chrome.
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, realpathSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { abrirNavegador, crearInforme, esperar } from "./navegador.mjs";
import { recorrido } from "./recorrido.mjs";

const RAIZ = resolve(import.meta.dirname, "..");
const PUERTO_API = 3101;
const PUERTO_WEB = 3100;
const BASE = `http://localhost:${PUERTO_WEB}`;
const API = `http://localhost:${PUERTO_API}/api`;
const NOMBRE_BD = "omshato_e2e";
const SERVIDOR_BD = process.env.E2E_POSTGRES ?? "postgres://omshato:omshato@localhost:5432";

const cuentas = {
  prueba: { correo: "prueba@omshato.com", contrasena: "clave-de-prueba-123" },
  bloqueo: { correo: "bloqueo@omshato.com", contrasena: "clave-de-bloqueo-123" },
  nuevaContrasena: "clave-nueva-de-prueba-456",
};

if (Number(process.versions.node.split(".")[0]) < 22) {
  console.error(
    "La prueba de navegador necesita Node 22 o superior (usa WebSocket y fetch nativos).",
  );
  process.exit(1);
}

// La ruta real, no la corta de Windows (JUANDA~1): el almacenamiento compara contra ella.
const carpetaFotos = realpathSync.native(mkdtempSync(join(tmpdir(), "omshato-e2e-fotos-")));
const entorno = {
  ...process.env,
  DATABASE_URL: `${SERVIDOR_BD}/${NOMBRE_BD}`,
  ALMACENAMIENTO_RUTA: carpetaFotos,
  PORT: String(PUERTO_API),
  CORS_ORIGIN: BASE,
  // El límite de solicitudes tiene su propia prueba; aquí estorbaría con tantos inicios de sesión.
  LIMITE_SOLICITUDES: "apagado",
  API_URL: `http://localhost:${PUERTO_API}`,
};

const servidores = [];
const registro = [];

function recordar(nombre, proceso) {
  const guardar = (datos) => registro.push(`[${nombre}] ${datos.toString().trimEnd()}`);
  proceso.stdout?.on("data", guardar);
  proceso.stderr?.on("data", guardar);
}

/** Corre un paso de preparación; si falla, muestra lo que imprimió y termina. */
function paso(descripcion, comando, argumentos, extra = {}) {
  console.log(`· ${descripcion}`);
  const resultado = spawnSync(comando, argumentos, {
    cwd: RAIZ,
    env: { ...entorno, ...extra.env },
    shell: process.platform === "win32",
    encoding: "utf8",
  });
  if (resultado.status !== 0) {
    console.error(`\nFalló: ${descripcion}\n${resultado.stdout}\n${resultado.stderr}`);
    throw new Error(descripcion);
  }
}

async function recrearBase() {
  console.log(`· Creando la base ${NOMBRE_BD}`);
  const { Client } = createRequire(resolve(RAIZ, "apps/api/package.json"))("pg");
  const cliente = new Client({ connectionString: `${SERVIDOR_BD}/postgres` });
  try {
    await cliente.connect();
  } catch (error) {
    throw new Error(`No pude conectar con PostgreSQL (¿corriste pnpm db:up?): ${error.message}`);
  }
  try {
    await cliente.query(`DROP DATABASE IF EXISTS ${NOMBRE_BD} WITH (FORCE)`);
    await cliente.query(`CREATE DATABASE ${NOMBRE_BD}`);
  } finally {
    await cliente.end();
  }
}

async function estaOcupado(puerto) {
  try {
    await fetch(`http://localhost:${puerto}/`, { signal: AbortSignal.timeout(1500) });
    return true;
  } catch {
    return false;
  }
}

async function esperarServidor(url, nombre) {
  for (let intento = 0; intento < 90; intento += 1) {
    try {
      if ((await fetch(url)).status < 500) return;
    } catch {
      // Todavía arrancando.
    }
    await esperar(1000);
  }
  throw new Error(`${nombre} no respondió en ${url}`);
}

const informe = crearInforme();
let nav;
let terminado = 1;

try {
  for (const puerto of [PUERTO_API, PUERTO_WEB]) {
    if (await estaOcupado(puerto)) {
      throw new Error(
        `El puerto ${puerto} está ocupado. Detén el servidor que lo usa y vuelve a intentar.`,
      );
    }
  }

  await recrearBase();
  paso("Aplicando migraciones", "pnpm", ["db:migrate"]);
  paso("Cargando estados, departamentos y ciudades", "pnpm", ["db:seed"]);
  for (const { correo, contrasena } of [cuentas.prueba, cuentas.bloqueo]) {
    paso(`Creando la cuenta ${correo}`, "pnpm", ["admin:crear"], {
      env: { ADMIN_CORREO: correo, ADMIN_CONTRASENA: contrasena, ADMIN_NOMBRE: "Prueba" },
    });
  }
  paso("Cargando los relojes de demostración", "pnpm", ["demo:cargar"]);
  // Next fija el destino de las fotos al compilar, así que se compila ya apuntando a este API.
  paso("Compilando el sitio", "pnpm", ["--filter", "@omshato/web", "build"]);

  console.log("· Levantando el API y el sitio");
  const api = spawn(process.execPath, ["dist/main"], {
    cwd: resolve(RAIZ, "apps/api"),
    env: entorno,
  });
  recordar("api", api);
  servidores.push(api);
  const web = spawn(
    process.execPath,
    [resolve(RAIZ, "apps/web/node_modules/next/dist/bin/next"), "start", "-p", String(PUERTO_WEB)],
    { cwd: resolve(RAIZ, "apps/web"), env: entorno },
  );
  recordar("web", web);
  servidores.push(web);
  await esperarServidor(`${API}/salud`, "El API");
  await esperarServidor(`${BASE}/`, "El sitio");

  console.log("· Abriendo Chrome\n");
  nav = await abrirNavegador({
    base: BASE,
    carpetaCapturas: process.env.E2E_CAPTURAS,
  });
  await recorrido({
    nav,
    informe,
    base: BASE,
    api: API,
    foto: resolve(RAIZ, "apps/api/demo/fotos/detalle.png"),
    cuentas,
  });

  console.log(
    informe.fallas === 0
      ? `\nTODO BIEN (${informe.total} verificaciones)`
      : `\n${informe.fallas} FALLAS de ${informe.total}`,
  );
  terminado = informe.fallas === 0 ? 0 : 1;
} catch (error) {
  console.error(`\n${error.message}`);
  if (registro.length > 0)
    console.error(`\nÚltimas líneas de los servidores:\n${registro.slice(-30).join("\n")}`);
} finally {
  nav?.cerrar();
  for (const servidor of servidores) servidor.kill();
  rmSync(carpetaFotos, { recursive: true, force: true });
}
process.exit(terminado);
