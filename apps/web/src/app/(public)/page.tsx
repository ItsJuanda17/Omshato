import type { Metadata } from "next";
import { Suspense } from "react";

import { Hero } from "@/components/catalogo/hero";
import { SeccionCatalogo } from "@/components/catalogo/seccion-catalogo";
import { SeccionReferenciaEspecial } from "@/components/catalogo/seccion-referencia-especial";
import { Cargando } from "@/components/feedback/estados";

export const metadata: Metadata = {
  title: { absolute: "Omshato · Tu tiempo, tu esencia" },
  alternates: { canonical: "/" },
};

// El catálogo cambia desde el panel, así que no se prerenderiza.
export const dynamic = "force-dynamic";

export default function PaginaInicio() {
  return (
    <>
      <Hero />

      <section id="catalogo" aria-labelledby="titulo-catalogo" className="scroll-mt-4">
        <div className="contenedor py-12 md:py-16">
          <div className="mb-8 space-y-2">
            <p className="etiqueta">Catálogo</p>
            <h2 id="titulo-catalogo" className="font-display text-headline-md uppercase md:text-headline-lg">
              Piezas en exhibición
            </h2>
          </div>
          <Suspense fallback={<Cargando mensaje="Cargando relojes" />}>
            <SeccionCatalogo />
          </Suspense>
        </div>
      </section>

      <SeccionReferenciaEspecial />
    </>
  );
}
