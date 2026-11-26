import Link from "next/link";
import { MessageCircleIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { SeparadorBisel } from "@/components/brand/separador-bisel";
import { enlaceWhatsApp } from "@/lib/contacto/enlaces";
import { contactoPublico } from "@/lib/contacto/servidor";

const enlaceClase =
  "etiqueta inline-flex min-h-9 items-center gap-2 text-tinta-2 transition-colors hover:text-tinta";

/** Pie de las páginas públicas. Muestra solo los contactos que estén configurados. */
export async function PiePublico() {
  const { whatsapp, instagram, tiktok } = await contactoPublico();

  return (
    <footer id="contacto" className="mt-auto border-t border-linea bg-carbon">
      <div className="contenedor flex flex-col items-center gap-6 py-14 text-center">
        <Logo variante="vertical" eslogan />
      </div>

      <div className="contenedor">
        <SeparadorBisel />
      </div>

      <div className="contenedor grid gap-10 py-10 md:grid-cols-3 md:items-start">
        <nav aria-label="Información legal" className="flex flex-col items-center md:items-start">
          <Link href="/politica-datos" className={enlaceClase}>
            Política de datos personales
          </Link>
          <Link href="/ayuda" className={enlaceClase}>
            Ayuda
          </Link>
        </nav>

        <ul className="flex flex-col items-center md:items-center">
          {whatsapp && (
            <li>
              <a
                href={enlaceWhatsApp(whatsapp) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={enlaceClase}
              >
                <MessageCircleIcon className="size-4" aria-hidden="true" />
                <span className="dato">{whatsapp.visible}</span>
                <span className="sr-only">(WhatsApp, se abre en una pestaña nueva)</span>
              </a>
            </li>
          )}
          {instagram && (
            <li>
              <a
                href={instagram.url}
                target="_blank"
                rel="noopener noreferrer"
                className={enlaceClase}
              >
                Instagram{" "}
                <span className="dato tracking-normal normal-case">@{instagram.usuario}</span>
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </li>
          )}
          {tiktok && (
            <li>
              <a
                href={tiktok.url}
                target="_blank"
                rel="noopener noreferrer"
                className={enlaceClase}
              >
                TikTok <span className="dato tracking-normal normal-case">@{tiktok.usuario}</span>
                <span className="sr-only">(se abre en una pestaña nueva)</span>
              </a>
            </li>
          )}
        </ul>

        <figure className="text-center md:text-right">
          <blockquote className="font-display text-title-lg font-normal tracking-normal text-tinta-2 italic">
            «En el día del bien goza del bien; y en el día de la adversidad considera.»
          </blockquote>
          <figcaption className="etiqueta mt-2">Eclesiastés 7:14</figcaption>
        </figure>
      </div>

      <div className="border-t border-linea">
        <p className="contenedor etiqueta py-5 text-center md:text-left">
          © {new Date().getFullYear()} Omshato · Colombia
        </p>
      </div>
    </footer>
  );
}
