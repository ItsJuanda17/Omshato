import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { MessageCircleIcon } from "lucide-react";

import { urlFoto } from "@/lib/relojes/fotos";
import { Engranaje } from "@/components/brand/engranajes";
import { SeparadorBisel } from "@/components/brand/separador-bisel";
import { GaleriaReloj } from "@/components/relojes/galeria-reloj";
import { InsigniaModo } from "@/components/relojes/insignia-modo";
import { ListaEspecificaciones } from "@/components/relojes/lista-especificaciones";
import { PlanoTecnico } from "@/components/relojes/plano-tecnico";
import { Precio } from "@/components/relojes/precio";
import { buttonVariants } from "@/components/ui/button";
import { obtenerReloj } from "@/lib/api/relojes";
import { enlaceWhatsApp, mensajeConsultaReloj } from "@/lib/contacto/enlaces";
import { contactoPublico } from "@/lib/contacto/servidor";
import { parsearEspecificaciones } from "@/lib/relojes/especificaciones";
import { slugificar } from "@/lib/formato";

type Props = { params: Promise<{ slug: string }> };

// La ficha cambia desde el panel (precio, modo, visibilidad), así que no se prerenderiza.
export const dynamic = "force-dynamic";

// Metadatos y página piden el mismo reloj: se consulta una sola vez por solicitud.
const consultarReloj = cache(obtenerReloj);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const reloj = await consultarReloj(slug);
  if (!reloj) return { title: "Reloj no disponible", robots: { index: false } };

  const titulo = `${reloj.marca.nombre} ${reloj.nombre}`;
  const descripcion =
    reloj.descripcion ?? `${titulo}. Mira sus fotos, su mecánica y haz tu pedido en Omshato.`;
  const principal = reloj.imagenes.find((imagen) => imagen.esPrincipal) ?? reloj.imagenes[0];

  return {
    title: titulo,
    description: descripcion,
    alternates: { canonical: `/relojes/${reloj.urlAmigable}` },
    openGraph: {
      title: titulo,
      description: descripcion,
      url: `/relojes/${reloj.urlAmigable}`,
      siteName: "Omshato",
      locale: "es_CO",
      type: "website",
      images: [{ url: urlFoto(principal.archivo), width: 800, height: 1000, alt: titulo }],
    },
    twitter: { card: "summary_large_image", title: titulo, description: descripcion },
  };
}

const PASOS_BAJO_PEDIDO = [
  {
    titulo: "Haces tu pedido",
    texto:
      "Llenas el formulario con tus datos de contacto y entrega. No necesitas crear una cuenta.",
  },
  {
    titulo: "Lo conseguimos",
    texto:
      "Consultamos con el proveedor y nos comunicamos contigo para confirmar disponibilidad, precio y plazo.",
  },
  {
    titulo: "Confirmamos y enviamos",
    texto: "Cuando todo está acordado, confirmamos el pedido y coordinamos el envío contigo.",
  },
];

export default async function PaginaFicha({ params }: Props) {
  const { slug } = await params;
  const reloj = await consultarReloj(slug);
  if (!reloj) notFound();

  const titulo = `${reloj.marca.nombre} ${reloj.nombre}`;
  const enlaceChat = enlaceWhatsApp(
    (await contactoPublico()).whatsapp,
    mensajeConsultaReloj(titulo),
  );
  const especificaciones = parsearEspecificaciones(reloj.detalleMecanica);
  const diametro = especificaciones.find((e) => /di[aá]metro/i.test(e.clave))?.valor;

  return (
    <div>
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
                href={`/?marca=${slugificar(reloj.marca.nombre)}#catalogo`}
                className="transition-colors hover:text-tinta"
              >
                {reloj.marca.nombre}
              </Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-tinta">
              {reloj.nombre}
            </li>
          </ol>
        </nav>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-16">
          <GaleriaReloj imagenes={reloj.imagenes} nombre={titulo} />

          <div className="space-y-8 lg:pt-2">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="etiqueta">{reloj.marca.nombre}</p>
                <InsigniaModo modo={reloj.modo} />
              </div>
              <h1 className="font-display text-display-md-mobile uppercase md:text-display-md">
                {reloj.nombre}
              </h1>
              <p className="text-body-md text-tinta-2">{reloj.genero}</p>
              <Precio valor={reloj.precioCop} className="block text-headline-lg text-tinta" />
            </header>

            {reloj.modo === "BAJO_PEDIDO" && (
              <aside className="space-y-2 border border-linea bg-superficie p-5">
                <p className="etiqueta text-tinta">Pieza bajo pedido</p>
                <p className="text-body-md text-tinta-2">
                  Este reloj se consigue con un proveedor después de tu pedido. Nos comunicaremos
                  contigo para confirmar disponibilidad y plazo.
                </p>
                {reloj.plazoEstimado && (
                  <p className="text-body-md text-tinta">
                    Plazo estimado: <span className="dato">{reloj.plazoEstimado}</span>
                  </p>
                )}
              </aside>
            )}

            <div className="flex flex-col gap-3">
              <Link
                href={`/pedido/${reloj.urlAmigable}`}
                className={buttonVariants({ size: "default" })}
              >
                Pedir este reloj
              </Link>
              {enlaceChat && (
                <a
                  href={enlaceChat}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline" })}
                >
                  <MessageCircleIcon aria-hidden="true" />
                  Consultar por WhatsApp
                  <span className="sr-only">(se abre en una pestaña nueva)</span>
                </a>
              )}
            </div>

            <dl className="space-y-4 border-t border-linea pt-6">
              <div className="space-y-1">
                <dt className="etiqueta">Garantía</dt>
                <dd className="text-body-md text-tinta">{reloj.garantia}</dd>
              </div>
              <div className="space-y-1">
                <dt className="etiqueta">Pago</dt>
                <dd className="text-body-md text-tinta-2">
                  No pagas en línea. Coordinamos el pago contigo después de tu pedido.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {especificaciones.length > 0 && (
        <section aria-labelledby="titulo-especificaciones" className="border-t border-linea">
          <div className="contenedor grid gap-10 py-14 md:py-20 lg:grid-cols-[1fr_20rem] lg:gap-20">
            <div className="space-y-8">
              <div className="space-y-2">
                <p className="etiqueta">Mecánica</p>
                <h2
                  id="titulo-especificaciones"
                  className="font-display text-headline-md uppercase md:text-headline-lg"
                >
                  Especificaciones técnicas
                </h2>
              </div>
              <ListaEspecificaciones especificaciones={especificaciones} />
            </div>
            <PlanoTecnico diametro={diametro} className="mx-auto w-full max-w-72 lg:mt-24" />
          </div>
        </section>
      )}

      {reloj.descripcion && (
        <section aria-labelledby="titulo-descripcion" className="border-t border-linea bg-carbon-2">
          <div className="contenedor relative overflow-hidden py-14 md:py-20">
            <Engranaje
              dientes={18}
              giro="horaria"
              duracion={160}
              className="absolute top-1/2 -right-24 hidden w-72 -translate-y-1/2 opacity-[0.12] lg:block"
            />
            <div className="relative max-w-2xl space-y-5">
              <p className="etiqueta">Sobre esta pieza</p>
              <h2
                id="titulo-descripcion"
                className="font-display text-headline-md uppercase md:text-headline-lg"
              >
                {titulo}
              </h2>
              <p className="text-body-lg text-tinta-2">{reloj.descripcion}</p>
            </div>
          </div>
        </section>
      )}

      {reloj.modo === "BAJO_PEDIDO" && (
        <section aria-labelledby="titulo-proceso" className="border-t border-linea">
          <div className="contenedor py-14 md:py-20">
            <div className="mb-10 space-y-2 text-center">
              <p className="etiqueta">Cómo funciona</p>
              <h2
                id="titulo-proceso"
                className="font-display text-headline-md uppercase md:text-headline-lg"
              >
                Proceso bajo pedido
              </h2>
            </div>
            <ol className="grid gap-px border border-linea bg-linea md:grid-cols-3">
              {PASOS_BAJO_PEDIDO.map((paso, i) => (
                <li key={paso.titulo} className="space-y-3 bg-superficie p-6 md:p-8">
                  <span className="dato text-headline-md text-tenue">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="font-display text-headline-sm uppercase">{paso.titulo}</h3>
                  <p className="text-body-md text-tinta-2">{paso.texto}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="contenedor">
            <SeparadorBisel />
          </div>
        </section>
      )}
    </div>
  );
}
