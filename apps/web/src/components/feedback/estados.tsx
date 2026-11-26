import type { ReactNode } from "react";

import { Engranaje, ParEngranajes } from "@/components/brand/engranajes";
import { cn } from "@/lib/utils";

/** Estado de carga: un par de engranajes girando lento. */
export function Cargando({
  mensaje = "Cargando",
  className,
}: {
  mensaje?: string;
  className?: string;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex flex-col items-center gap-5 py-16 text-center", className)}
    >
      <ParEngranajes className="w-28 opacity-50" />
      <p className="etiqueta">{mensaje}</p>
    </div>
  );
}

interface EstadoVacioProps {
  titulo: string;
  descripcion?: string;
  /** Acción opcional: un botón o un enlace. */
  accion?: ReactNode;
  /**
   * `publico` usa el par de engranajes del sitio. `panel` es casi sin decoración:
   * solo un engranaje pequeño.
   */
  variante?: "publico" | "panel";
  className?: string;
}

/** Estado vacío: mensaje claro con el motivo mecánico justo. */
export function EstadoVacio({
  titulo,
  descripcion,
  accion,
  variante = "publico",
  className,
}: EstadoVacioProps) {
  return (
    <div className={cn("flex flex-col items-center gap-5 py-16 text-center", className)}>
      {variante === "publico" ? (
        <ParEngranajes girando className="w-28 opacity-40" />
      ) : (
        <Engranaje dientes={12} className="w-10 opacity-40" />
      )}
      <div className="max-w-md space-y-2">
        <h2 className="font-display text-headline-sm uppercase">{titulo}</h2>
        {descripcion && <p className="text-body-md text-tinta-2">{descripcion}</p>}
      </div>
      {accion}
    </div>
  );
}
