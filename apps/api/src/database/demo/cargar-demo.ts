import { esquemaDatosReloj } from "@omshato/contratos";
import { NestFactory } from "@nestjs/core";
import { StorageDisk } from "@nestjs/storage";
import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { AppModule } from "../../app.module.js";
import { CatalogoAdminService } from "../../modules/catalogo/catalogo-admin.service.js";
import { ContactoService } from "../../modules/contacto/contacto.service.js";
import { RELOJES_DEMO } from "./relojes-demo.js";

/**
 * Punto de entrada de `pnpm demo:cargar`. Sube las fotos de ejemplo y crea unos relojes y los
 * enlaces de contacto, usando los mismos servicios que el panel: pasan por las mismas reglas.
 * Corre desde `dist` (no con tsx) porque Nest necesita los metadatos que genera `tsc`.
 * No hace nada si ya hay relojes, para no mezclar la demostración con datos reales.
 */
const CARPETA_FOTOS = join(import.meta.dirname, "../../../demo/fotos");
const FOTOS = ["frontal-1", "frontal-2", "frontal-3", "frontal-4", "reverso", "detalle"] as const;

const app = await NestFactory.createApplicationContext(AppModule, { logger: ["error", "warn"] });
try {
  const catalogo = app.get(CatalogoAdminService, { strict: false });
  if ((await catalogo.listar()).length > 0) {
    console.log("Ya hay relojes cargados: no se agrega la demostración.");
  } else {
    // Cada foto se sube una vez y los relojes que la comparten usan la misma clave.
    const disco = app.get(StorageDisk, { strict: false });
    const claves = new Map<string, string>();
    for (const nombre of FOTOS) {
      const clave = `relojes/${randomUUID()}.png`;
      await disco.put(clave, await readFile(join(CARPETA_FOTOS, `${nombre}.png`)), {
        contentType: "image/png",
      });
      claves.set(nombre, clave);
    }

    for (const demo of RELOJES_DEMO) {
      const fotos = [`frontal-${demo.esfera}`, "reverso", "detalle"].map(
        (nombre) => claves.get(nombre) as string,
      );
      await catalogo.crear(
        esquemaDatosReloj.parse({
          nombre: demo.nombre,
          marcaNueva: demo.marca,
          genero: demo.genero,
          precioCop: demo.precioCop,
          modo: demo.modo,
          cantidad: demo.cantidad ?? null,
          plazoEstimado: demo.plazoEstimado ?? null,
          garantia: "12 meses de garantía con Omshato",
          detalleMecanica: demo.mecanica.join("\n"),
          descripcion: demo.descripcion,
          visible: demo.visible,
          fotos,
        }),
      );
    }

    await app.get(ContactoService, { strict: false }).actualizar({
      whatsapp: { valor: "300 123 4567", activo: true },
      instagram: { valor: "https://www.instagram.com/omsha_to", activo: true },
      tiktok: { valor: "https://www.tiktok.com/@omsha_to", activo: true },
    });
    console.log(`Demostración lista: ${RELOJES_DEMO.length} relojes y los enlaces de contacto.`);
  }
} finally {
  await app.close();
}
