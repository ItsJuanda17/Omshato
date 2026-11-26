import { Engranaje } from "@/components/brand/engranajes";

/** Carga del panel: casi sin decoración, un solo engranaje pequeño girando lento. */
export function CargandoPanel({ mensaje = "Cargando" }: { mensaje?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-20">
      <Engranaje dientes={12} giro="horaria" duracion={14} className="w-10 opacity-50" />
      <p className="etiqueta">{mensaje}</p>
    </div>
  );
}

/** Falla al cargar datos del panel, con una acción para reintentar. */
export function ErrorPanel({ alReintentar }: { alReintentar: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="text-body-md text-tinta">No pudimos cargar los datos.</p>
      <button
        type="button"
        onClick={alReintentar}
        className="etiqueta cursor-pointer text-tinta underline underline-offset-4"
      >
        Reintentar
      </button>
    </div>
  );
}
