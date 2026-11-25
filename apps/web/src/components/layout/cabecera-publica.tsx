import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { enlacesNavegacion } from "@/components/layout/navegacion";
import { MenuMovil } from "@/components/layout/menu-movil";

export function CabeceraPublica() {
  return (
    <header className="relative border-b border-linea bg-carbon">
      <div className="contenedor grid h-16 grid-cols-[1fr_auto_1fr] items-center md:h-20">
        <MenuMovil />
        <Link href="/" aria-label="Omshato, ir al inicio" className="col-start-2 justify-self-center">
          <Logo variante="horizontal" />
        </Link>
      </div>

      <nav aria-label="Navegación principal" className="hidden border-t border-linea md:block">
        <ul className="contenedor flex items-center justify-center gap-12">
          {enlacesNavegacion.map((enlace) => (
            <li key={enlace.href}>
              <Link
                href={enlace.href}
                className="etiqueta flex min-h-12 items-center text-tinta-2 transition-colors hover:text-tinta"
              >
                {enlace.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
