import Link from "next/link";

import { Engranaje, RuedaEscape, Tornillo } from "@/components/brand/engranajes";
import { Logo } from "@/components/brand/logo";
import { SeparadorBisel } from "@/components/brand/separador-bisel";
import { buttonVariants } from "@/components/ui/button";

/**
 * Portada. Los engranajes van recortados en los bordes y a baja opacidad:
 * a los lados en pantallas anchas y en una franja inferior en las angostas,
 * nunca detrás del texto.
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-linea">
      {/* Pantallas anchas: engranajes recortados en los bordes laterales. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 hidden lg:block">
        <Engranaje
          dientes={28}
          giro="horaria"
          duracion={180}
          className="absolute top-1/2 -left-40 w-[26rem] -translate-y-1/2 opacity-[0.14]"
        />
        <Engranaje
          dientes={20}
          giro="antihoraria"
          duracion={130}
          className="absolute -top-24 left-[17rem] w-56 opacity-10"
        />
        <RuedaEscape
          giro="horaria"
          duracion={200}
          className="absolute top-1/2 -right-36 w-[24rem] -translate-y-1/2 opacity-[0.14]"
        />
        <Tornillo className="absolute top-8 right-12 w-6 opacity-20" angulo={20} />
        <Tornillo className="absolute bottom-8 left-12 w-6 opacity-20" angulo={70} />
      </div>

      <div className="contenedor relative flex flex-col items-center gap-6 pt-16 pb-10 text-center md:pt-24 lg:pb-24">
        <Logo variante="simbolo" className="[&_img]:h-12" />
        <p className="etiqueta">Relojes en Colombia</p>
        <h1 className="font-display text-display-lg-mobile uppercase md:text-display-lg">
          Omshato
        </h1>
        <p className="font-display text-headline-sm text-tinta uppercase">Tu tiempo, tu esencia</p>
        <p className="max-w-xl text-body-lg text-tinta-2">
          Relojes seleccionados con su mecánica a la vista. Elige una pieza disponible o pide la que
          buscas y la conseguimos para ti.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link href="#catalogo" className={buttonVariants()}>
            Ver relojes
          </Link>
          <Link
            href="/?disponibilidad=bajo-pedido#catalogo"
            className={buttonVariants({ variant: "outline" })}
          >
            Bajo pedido
          </Link>
        </div>
      </div>

      {/* Pantallas angostas: franja inferior con engranajes recortados. */}
      <div aria-hidden="true" className="pointer-events-none relative h-24 overflow-hidden lg:hidden">
        <Engranaje
          dientes={24}
          giro="horaria"
          duracion={160}
          className="absolute -bottom-24 left-[8%] w-52 opacity-[0.14]"
        />
        <Engranaje
          dientes={16}
          giro="antihoraria"
          duracion={110}
          className="absolute -right-6 -bottom-16 w-40 opacity-[0.14]"
        />
      </div>

      <div className="contenedor">
        <SeparadorBisel />
      </div>
    </section>
  );
}
