import { buttonVariants } from "@/components/ui/button";
import { Engranaje } from "@/components/brand/engranajes";
import { enlaceWhatsApp } from "@/lib/contacto";

/** Invita a pedir un reloj que no está en el catálogo, que es el caso de "Bajo pedido". */
export function SeccionReferenciaEspecial() {
  return (
    <section className="relative overflow-hidden border-t border-linea bg-carbon-2">
      <Engranaje
        dientes={20}
        giro="horaria"
        duracion={150}
        className="absolute top-1/2 -right-28 hidden w-80 -translate-y-1/2 opacity-[0.12] lg:block"
      />
      <div className="contenedor relative py-16 md:py-20">
        <div className="max-w-2xl space-y-5">
          <p className="etiqueta">Bajo pedido</p>
          <h2 className="font-display text-headline-md uppercase md:text-headline-lg">
            ¿Buscas una referencia especial?
          </h2>
          <p className="text-body-lg text-tinta-2">
            Si el reloj que quieres no aparece en el catálogo, escríbenos. Lo consultamos con
            nuestros proveedores y te contamos precio y plazo antes de que decidas.
          </p>
          <div className="pt-2">
            <a
              href={enlaceWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants()}
            >
              Consultar por WhatsApp
              <span className="sr-only">(se abre en una pestaña nueva)</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
