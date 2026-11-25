import Image from "next/image";
import Link from "next/link";

import { InsigniaModo } from "@/components/relojes/insignia-modo";
import { Precio } from "@/components/relojes/precio";
import type { RelojResumen } from "@/lib/api/tipos";

/** Tarjeta del catálogo (REQ-CAT-2). Toda la tarjeta es un enlace a la ficha. */
export function TarjetaReloj({ reloj, prioridad = false }: { reloj: RelojResumen; prioridad?: boolean }) {
  return (
    <Link
      href={`/relojes/${reloj.urlAmigable}`}
      className="group flex h-full flex-col border border-linea bg-superficie transition-colors duration-[400ms] ease-out hover:border-tenue"
    >
      <div className="relative aspect-[4/5] overflow-hidden border-b border-linea bg-carbon-2">
        <Image
          src={reloj.imagenPrincipal.archivo}
          alt={`${reloj.marca.nombre} ${reloj.nombre}`}
          fill
          priority={prioridad}
          sizes="(min-width: 1024px) 22vw, (min-width: 768px) 30vw, 46vw"
          className="object-cover"
        />
        <InsigniaModo modo={reloj.modo} className="absolute top-3 left-3 bg-carbon/85" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
        <div className="space-y-1.5">
          <p className="etiqueta">{reloj.marca.nombre}</p>
          <h3 className="text-body-md font-medium text-tinta md:text-title-lg">{reloj.nombre}</h3>
        </div>
        <Precio valor={reloj.precioCop} className="mt-auto pt-2 text-body-md text-tinta md:text-title-lg" />
      </div>
    </Link>
  );
}
