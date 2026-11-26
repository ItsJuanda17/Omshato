"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Props {
  abierto: boolean;
  alCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children?: ReactNode;
  className?: string;
}

/**
 * Cuadro de diálogo modal con el elemento nativo `<dialog>`: atrapa el foco,
 * se cierra con Escape y no necesita dependencias. El contenido se monta solo
 * mientras está abierto, así los formularios empiezan limpios cada vez.
 */
export function Dialogo({ abierto, alCerrar, titulo, descripcion, children, className }: Props) {
  const referencia = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  return (
    <dialog
      ref={referencia}
      onClose={alCerrar}
      onClick={(evento) => {
        // Un clic en el fondo oscuro cierra el diálogo.
        if (evento.target === evento.currentTarget) alCerrar();
      }}
      aria-labelledby={idTitulo}
      aria-describedby={descripcion ? idDescripcion : undefined}
      className={cn(
        "m-auto w-[min(32rem,calc(100%-2rem))] border border-divisor bg-elevada p-0 text-tinta backdrop:bg-black/75",
        className,
      )}
    >
      {abierto && (
        <div className="space-y-6 p-6">
          <div className="space-y-2">
            <h2 id={idTitulo} className="font-display text-headline-sm uppercase">
              {titulo}
            </h2>
            {descripcion && (
              <p id={idDescripcion} className="text-body-md text-tinta-2">
                {descripcion}
              </p>
            )}
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
