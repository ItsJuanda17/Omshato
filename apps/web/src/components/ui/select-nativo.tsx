import * as React from "react";
import { ChevronDownIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Selector nativo con el estilo del sistema de diseño. Se usa el del navegador
 * porque en móvil abre el selector del sistema y funciona con teclado sin más.
 */
function SelectNativo({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "h-12 w-full cursor-pointer appearance-none rounded-none border border-linea bg-carbon-2 pr-12 pl-5 text-body-md text-tinta transition-colors outline-none focus-visible:border-tinta focus-visible:shadow-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-dashed aria-invalid:border-tinta",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon
        className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-tinta-2"
        aria-hidden="true"
      />
    </div>
  );
}

export { SelectNativo };
