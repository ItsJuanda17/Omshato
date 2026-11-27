// Chrome headless dirigido por el protocolo de depuración (CDP), sin dependencias: usa el
// WebSocket y el fetch que ya trae Node 22 o superior.
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const CANDIDATOS_CHROME = {
  win32: [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  ],
  darwin: ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"],
  linux: ["/usr/bin/google-chrome", "/usr/bin/google-chrome-stable", "/usr/bin/chromium"],
};

export function encontrarChrome() {
  const ruta =
    process.env.CHROME_PATH ??
    (CANDIDATOS_CHROME[process.platform] ?? []).find((c) => existsSync(c));
  if (!ruta || !existsSync(ruta)) {
    throw new Error("No encuentro Chrome. Define CHROME_PATH con la ruta del ejecutable.");
  }
  return ruta;
}

export const esperar = (ms) => new Promise((resolver) => setTimeout(resolver, ms));

/** Cuenta las verificaciones y las imprime a medida que ocurren. */
export function crearInforme() {
  let fallas = 0;
  let total = 0;
  return {
    verificar(nombre, condicion, detalle = "") {
      total += 1;
      if (!condicion) fallas += 1;
      console.log(`${condicion ? "OK  " : "FALLA"} ${nombre}${detalle ? ` → ${detalle}` : ""}`);
    },
    get fallas() {
      return fallas;
    },
    get total() {
      return total;
    },
  };
}

/**
 * Abre Chrome y devuelve las operaciones que usan los recorridos. `base` es el sitio que se
 * prueba; si se da `carpetaCapturas`, `captura(nombre)` guarda ahí una imagen.
 */
export async function abrirNavegador({ base, carpetaCapturas, puertoDepuracion = 9227 }) {
  const datosDePerfil = mkdtempSync(join(tmpdir(), "omshato-e2e-chrome-"));
  const chrome = spawn(
    encontrarChrome(),
    [
      "--headless=new",
      "--disable-gpu",
      `--remote-debugging-port=${puertoDepuracion}`,
      "--window-size=1440,1000",
      "--hide-scrollbars",
      `--user-data-dir=${datosDePerfil}`,
      "about:blank",
    ],
    { stdio: "ignore" },
  );

  let objetivo;
  for (let intento = 0; intento < 60 && !objetivo; intento += 1) {
    try {
      const pestanas = await (await fetch(`http://127.0.0.1:${puertoDepuracion}/json`)).json();
      objetivo = pestanas.find((p) => p.type === "page");
    } catch {
      // Chrome todavía está arrancando.
    }
    if (!objetivo) await esperar(250);
  }
  if (!objetivo) {
    chrome.kill();
    throw new Error("Chrome no abrió el puerto de depuración.");
  }

  const ws = new WebSocket(objetivo.webSocketDebuggerUrl);
  await new Promise((resolver) => (ws.onopen = resolver));
  let id = 0;
  const pendientes = new Map();
  ws.onmessage = (mensaje) => {
    const datos = JSON.parse(mensaje.data);
    if (datos.id && pendientes.has(datos.id)) pendientes.get(datos.id)(datos);
  };
  const cmd = (metodo, parametros = {}) =>
    new Promise((resolver) => {
      id += 1;
      pendientes.set(id, resolver);
      ws.send(JSON.stringify({ id, method: metodo, params: parametros }));
    });

  await cmd("Page.enable");
  await cmd("Network.enable");
  await cmd("DOM.enable");

  /** Evalúa una expresión en la página y devuelve su valor. */
  const ev = async (expresion) =>
    (
      await cmd("Runtime.evaluate", {
        expression: expresion,
        returnByValue: true,
        awaitPromise: true,
      })
    ).result.result?.value;

  const ir = async (ruta, ms = 2200) => {
    await cmd("Page.navigate", { url: base + ruta });
    await esperar(ms);
  };

  const texto = async () => {
    const crudo = (await ev("document.body.innerText.replace(/\\s+/g, ' ')")).toLowerCase();
    return { raw: crudo, includes: (fragmento) => crudo.includes(fragmento.toLowerCase()) };
  };

  return {
    cmd,
    ev,
    ir,
    texto,
    esperar,
    ruta: () => ev("location.pathname"),
    cuenta: (selector) => ev(`document.querySelectorAll(${JSON.stringify(selector)}).length`),

    /** Pulsa el primer elemento cuyo texto empieza con `inicio`. */
    clic: (inicio, selector = "button, a") =>
      ev(`(() => {
        const el = [...document.querySelectorAll(${JSON.stringify(selector)})]
          .find((b) => b.textContent.trim().replace(/\\s+/g, ' ').startsWith(${JSON.stringify(inicio)}));
        if (!el) return false;
        el.click();
        return true;
      })()`),

    /** Escribe en un campo como lo haría una persona, para que React y RHF lo registren. */
    escribir: (selector, valor) =>
      ev(`(() => {
        const el = document.querySelector(${JSON.stringify(selector)});
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype
          : el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, ${JSON.stringify(valor)});
        el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
      })()`),

    /** Elige un archivo en un `<input type=file>`. */
    async subirArchivo(selector, rutaArchivo) {
      const documento = (await cmd("DOM.getDocument")).result.root.nodeId;
      const nodo = (await cmd("DOM.querySelector", { nodeId: documento, selector })).result.nodeId;
      await cmd("DOM.setFileInputFiles", { files: [rutaArchivo], nodeId: nodo });
    },

    /** Repite la comprobación hasta que se cumpla o se acabe el tiempo. */
    async esperarHasta(comprobar, maximoMs = 8000) {
      const limite = Date.now() + maximoMs;
      while (Date.now() < limite) {
        if (await comprobar()) return true;
        await esperar(200);
      }
      return false;
    },

    cookies: async () => (await cmd("Network.getCookies", { urls: [base] })).result.cookies,

    async captura(nombre) {
      if (!carpetaCapturas) return;
      mkdirSync(carpetaCapturas, { recursive: true });
      const resultado = await cmd("Page.captureScreenshot", { format: "png" });
      writeFileSync(
        join(carpetaCapturas, `${nombre}.png`),
        Buffer.from(resultado.result.data, "base64"),
      );
    },

    cerrar() {
      ws.close();
      chrome.kill();
      // Chrome suelta los archivos del perfil unos instantes después de cerrarse.
      setTimeout(() => rmSync(datosDePerfil, { recursive: true, force: true }), 1500).unref();
    },
  };
}
