import type { ReactNode } from "react";
import { CircleAlertIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Atributos que el control debe recibir para quedar enlazado con su etiqueta y su mensaje. */
export interface AtributosControl {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
}

interface CampoProps {
  id: string;
  etiqueta: string;
  /** Mensaje de error junto al campo. Aparece en español claro, sin términos técnicos. */
  error?: string;
  ayuda?: string;
  className?: string;
  children: (atributos: AtributosControl) => ReactNode;
}

/** Etiqueta, control, ayuda y error de un campo de formulario. */
export function Campo({ id, etiqueta, error, ayuda, className, children }: CampoProps) {
  const idError = `${id}-error`;
  const idAyuda = `${id}-ayuda`;
  const descripcion = [error ? idError : null, ayuda ? idAyuda : null].filter(Boolean).join(" ");

  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={id}>{etiqueta}</Label>
      {children({
        id,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": descripcion || undefined,
      })}
      {ayuda && (
        <p id={idAyuda} className="text-body-sm text-tinta-3">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={idError} className="flex items-start gap-2 text-body-sm text-tinta">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
    </div>
  );
}
