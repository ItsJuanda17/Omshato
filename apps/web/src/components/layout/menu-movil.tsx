"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { MenuIcon, XIcon } from "lucide-react";

import { enlacesNavegacion } from "@/components/layout/navegacion";

/** Menú desplegable para pantallas pequeñas. En escritorio la navegación va en línea. */
export function MenuMovil() {
  const [abierto, setAbierto] = useState(false);
  const idPanel = useId();

  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setAbierto(false);
    };
    document.addEventListener("keydown", alPulsar);
    return () => document.removeEventListener("keydown", alPulsar);
  }, [abierto]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls={idPanel}
        aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setAbierto((valor) => !valor)}
        className="-ml-2 flex size-11 cursor-pointer items-center justify-center text-tinta"
      >
        {abierto ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
      </button>

      <nav
        id={idPanel}
        aria-label="Navegación principal"
        hidden={!abierto}
        className="absolute inset-x-0 top-full border-b border-linea bg-carbon"
      >
        <ul className="contenedor flex flex-col py-2">
          {enlacesNavegacion.map((enlace) => (
            <li key={enlace.href} className="border-b border-linea last:border-b-0">
              <Link
                href={enlace.href}
                onClick={() => setAbierto(false)}
                className="etiqueta flex min-h-12 items-center text-tinta"
              >
                {enlace.etiqueta}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
