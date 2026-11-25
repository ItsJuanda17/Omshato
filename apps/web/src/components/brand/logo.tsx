import Image from "next/image";

import { cn } from "@/lib/utils";

/** Archivo del símbolo. El logo oficial se reemplaza en public/ sin tocar nada más. */
const RUTA_SIMBOLO = "/logo-omshato.svg";

interface LogoProps {
  /**
   * - `simbolo`: solo los dos destellos.
   * - `horizontal`: símbolo y nombre en una línea (encabezado).
   * - `vertical`: símbolo sobre el nombre (portada, login y pie).
   */
  variante?: "simbolo" | "horizontal" | "vertical";
  /** Muestra el eslogan bajo el nombre. */
  eslogan?: boolean;
  className?: string;
}

export function Logo({ variante = "horizontal", eslogan = false, className }: LogoProps) {
  const simbolo = (
    <Image
      src={RUTA_SIMBOLO}
      alt=""
      width={100}
      height={90}
      unoptimized
      className={cn(
        "w-auto shrink-0",
        variante === "vertical" ? "h-12" : variante === "horizontal" ? "h-7" : "h-10",
      )}
    />
  );

  if (variante === "simbolo") {
    return (
      <span className={cn("inline-flex", className)}>
        {simbolo}
        <span className="sr-only">Omshato</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center",
        variante === "vertical" ? "flex-col gap-4" : "gap-3",
        className,
      )}
    >
      {simbolo}
      <span
        className={cn("flex flex-col", variante === "vertical" ? "items-center" : "items-start")}
      >
        <span className="font-display text-headline-md leading-none tracking-[0.18em] text-tinta">
          OMSHATO
        </span>
        {eslogan && <span className="etiqueta mt-2 text-tinta-2">Tu tiempo, tu esencia</span>}
      </span>
    </span>
  );
}
