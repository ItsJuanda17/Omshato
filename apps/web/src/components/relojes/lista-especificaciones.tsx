import type { Especificacion } from "@/lib/relojes/especificaciones";

/**
 * Especificaciones con callouts numerados al estilo de un plano técnico:
 * número, concepto, línea guía punteada y valor.
 */
export function ListaEspecificaciones({
  especificaciones,
}: {
  especificaciones: Especificacion[];
}) {
  return (
    <dl className="border-t border-linea">
      {especificaciones.map((especificacion, i) => (
        <div
          key={`${especificacion.clave}-${i}`}
          className="flex items-baseline gap-3 border-b border-linea py-4 sm:gap-4"
        >
          <span
            aria-hidden="true"
            className="dato inline-flex size-7 shrink-0 items-center justify-center self-center border border-divisor text-label-sm text-tinta-3"
          >
            {String(i + 1).padStart(2, "0")}
          </span>
          {especificacion.clave && <dt className="etiqueta shrink-0">{especificacion.clave}</dt>}
          <span
            aria-hidden="true"
            className="min-w-4 flex-1 -translate-y-1 border-b border-dotted border-divisor"
          />
          <dd className="dato text-right text-body-md text-tinta">{especificacion.valor}</dd>
        </div>
      ))}
    </dl>
  );
}
