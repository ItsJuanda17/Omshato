import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Plus_Jakarta_Sans, Syne } from "next/font/google";

import "./globals.css";

const fuenteDisplay = Syne({
  variable: "--fuente-display",
  subsets: ["latin"],
  display: "swap",
});

const fuenteCuerpo = Plus_Jakarta_Sans({
  variable: "--fuente-cuerpo",
  subsets: ["latin"],
  display: "swap",
});

const fuenteMono = JetBrains_Mono({
  variable: "--fuente-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "Omshato · Tu tiempo, tu esencia",
    template: "%s · Omshato",
  },
  description:
    "Omshato es una tienda de relojes en Colombia. Explora el catálogo, conoce la mecánica de cada pieza y haz tu pedido sin registrarte.",
  openGraph: {
    siteName: "Omshato",
    locale: "es_CO",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f0f0f",
  colorScheme: "dark",
};

export default function LayoutRaiz({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      className={`${fuenteDisplay.variable} ${fuenteCuerpo.variable} ${fuenteMono.variable} h-full`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href="#contenido"
          className="etiqueta fixed top-2 left-2 z-50 -translate-y-20 bg-tinta px-4 py-3 text-carbon focus:translate-y-0"
        >
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
