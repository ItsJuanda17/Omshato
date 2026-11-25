"use client";

import Image from "next/image";
import { ArrowDownIcon, ArrowUpIcon, XIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { descripcionFoto, fotosDeEjemplo } from "@/lib/relojes/fotos-ejemplo";

interface Props {
  /** Rutas de las fotos elegidas, en orden. La primera es la principal (REQ-ADM-10). */
  valor: string[];
  alCambiar: (fotos: string[]) => void;
  error?: string;
}

/**
 * Elige, ordena y define la foto principal. Por ahora las fotos salen de una
 * biblioteca de ejemplo; la subida de archivos llega con el backend.
 */
export function SelectorFotos({ valor, alCambiar, error }: Props) {
  const disponibles = fotosDeEjemplo.filter((foto) => !valor.includes(foto.archivo));

  function mover(desde: number, hasta: number) {
    const copia = [...valor];
    const [movida] = copia.splice(desde, 1);
    copia.splice(hasta, 0, movida);
    alCambiar(copia);
  }

  return (
    <div className="space-y-5">
      {valor.length > 0 && (
        <ol className="space-y-2">
          {valor.map((archivo, i) => (
            <li
              key={archivo}
              className="flex flex-wrap items-center gap-4 border border-linea bg-superficie p-3"
            >
              <div className="relative aspect-[4/5] w-12 shrink-0 overflow-hidden border border-linea bg-carbon-2">
                <Image src={archivo} alt="" fill sizes="48px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-body-md text-tinta">{descripcionFoto(archivo)}</p>
                {i === 0 ? (
                  <Badge variant="activo">Principal</Badge>
                ) : (
                  <span className="text-body-sm text-tinta-3">Foto {i + 1}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {i > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => mover(i, 0)}>
                    Hacer principal
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Subir ${descripcionFoto(archivo)}`}
                  disabled={i === 0}
                  onClick={() => mover(i, i - 1)}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Bajar ${descripcionFoto(archivo)}`}
                  disabled={i === valor.length - 1}
                  onClick={() => mover(i, i + 1)}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Quitar ${descripcionFoto(archivo)}`}
                  onClick={() => alCambiar(valor.filter((f) => f !== archivo))}
                >
                  <XIcon />
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {disponibles.length > 0 && (
        <div className="space-y-3">
          <p className="etiqueta">Agregar desde la biblioteca de ejemplo</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {disponibles.map((foto) => (
              <li key={foto.archivo}>
                <button
                  type="button"
                  onClick={() => alCambiar([...valor, foto.archivo])}
                  aria-label={`Agregar ${foto.descripcion}`}
                  className="relative block aspect-[4/5] w-full cursor-pointer overflow-hidden border border-linea bg-carbon-2 transition-colors hover:border-tinta"
                >
                  <Image src={foto.archivo} alt="" fill sizes="100px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && (
        <p role="alert" className="text-body-sm text-tinta">
          {error}
        </p>
      )}
    </div>
  );
}
