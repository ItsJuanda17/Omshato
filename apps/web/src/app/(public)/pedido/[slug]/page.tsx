import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import { FormularioPedido } from "@/components/pedidos/formulario-pedido";
import { ResumenReloj } from "@/components/pedidos/resumen-reloj";
import { obtenerReloj } from "@/lib/api/relojes";
import { listarCiudades, listarDepartamentos } from "@/lib/api/ubicaciones";

type Props = { params: Promise<{ slug: string }> };

export const dynamic = "force-dynamic";

const consultarReloj = cache(obtenerReloj);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reloj = await consultarReloj(slug);
  return {
    title: reloj ? `Pedir ${reloj.marca.nombre} ${reloj.nombre}` : "Reloj no disponible",
    robots: { index: false },
  };
}

export default async function PaginaPedido({ params }: Props) {
  const { slug } = await params;
  const [reloj, departamentos, ciudades] = await Promise.all([
    consultarReloj(slug),
    listarDepartamentos(),
    listarCiudades(),
  ]);
  // Un reloj oculto no se puede pedir (RN y REQ-DET-6).
  if (!reloj) notFound();

  return (
    <div className="contenedor py-8 md:py-12">
      <nav aria-label="Ruta de navegación" className="etiqueta">
        <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <li>
            <Link href="/#catalogo" className="transition-colors hover:text-tinta">
              Catálogo
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/relojes/${reloj.urlAmigable}`}
              className="transition-colors hover:text-tinta"
            >
              {reloj.nombre}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-tinta">
            Pedido
          </li>
        </ol>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-16">
        <div className="lg:order-2 lg:max-w-2xl">
          <header className="mb-10 space-y-4">
            <p className="etiqueta">Pedido sin registro</p>
            <h1 className="font-display text-display-md-mobile uppercase md:text-display-md">
              Pide este reloj
            </h1>
            <p className="text-body-lg text-tinta-2">
              No necesitas crear una cuenta. Déjanos tus datos y nos comunicamos contigo para
              coordinar el pago y la entrega. Todos los campos son obligatorios.
            </p>
          </header>
          <FormularioPedido idReloj={reloj.id} departamentos={departamentos} ciudades={ciudades} />
        </div>

        <div className="lg:order-1">
          <div className="lg:sticky lg:top-6">
            <ResumenReloj reloj={reloj} />
          </div>
        </div>
      </div>
    </div>
  );
}
