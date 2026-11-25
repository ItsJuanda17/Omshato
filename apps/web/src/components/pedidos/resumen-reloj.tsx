import Image from "next/image";

import { InsigniaModo } from "@/components/relojes/insignia-modo";
import { Precio } from "@/components/relojes/precio";
import type { Reloj } from "@/lib/api/tipos";
import { parsearEspecificaciones } from "@/lib/especificaciones";

/** Resumen del reloj que se está pidiendo, junto al formulario. */
export function ResumenReloj({ reloj }: { reloj: Reloj }) {
  const principal = reloj.imagenes.find((imagen) => imagen.esPrincipal) ?? reloj.imagenes[0];
  const especificaciones = parsearEspecificaciones(reloj.detalleMecanica).slice(0, 3);

  return (
    <aside aria-label="Reloj que estás pidiendo" className="border border-linea bg-superficie">
      <div className="space-y-4 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <p className="etiqueta">{reloj.marca.nombre}</p>
          <InsigniaModo modo={reloj.modo} />
        </div>
        <div className="relative aspect-[4/5] overflow-hidden border border-linea bg-carbon-2">
          <Image
            src={principal.archivo}
            alt={`${reloj.marca.nombre} ${reloj.nombre}`}
            fill
            sizes="(min-width: 1024px) 28vw, 100vw"
            className="object-cover"
          />
        </div>
        <h2 className="font-display text-headline-md uppercase">{reloj.nombre}</h2>
        {especificaciones.length > 0 && (
          <dl className="border-t border-linea">
            {especificaciones.map((e) => (
              <div
                key={e.clave}
                className="flex justify-between gap-4 border-b border-linea py-2.5 text-body-sm"
              >
                <dt className="etiqueta">{e.clave}</dt>
                <dd className="dato text-right text-tinta">{e.valor}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className="space-y-2 border-t border-linea p-5 md:p-6">
        <p className="etiqueta">Valor</p>
        <Precio valor={reloj.precioCop} className="block text-headline-lg text-tinta" />
        {reloj.modo === "BAJO_PEDIDO" && (
          <p className="pt-2 text-body-sm text-tinta-2">
            Se consigue con un proveedor tras tu pedido.
            {reloj.plazoEstimado && (
              <>
                {" "}
                Plazo estimado: <span className="dato">{reloj.plazoEstimado}</span>.
              </>
            )}
          </p>
        )}
      </div>
    </aside>
  );
}
