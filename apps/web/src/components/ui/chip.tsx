import * as React from "react";

import { cn } from "@/lib/utils";

/** Botón rectangular de filtro. `activo` lo marca como seleccionado. */
function Chip({
  activo = false,
  className,
  type = "button",
  ...props
}: React.ComponentProps<"button"> & { activo?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={activo}
      data-slot="chip"
      className={cn(
        "inline-flex min-h-9 cursor-pointer items-center gap-2 rounded-none border px-3 font-sans text-label-sm uppercase transition-colors duration-150",
        activo
          ? "border-tinta bg-superficie text-tinta"
          : "border-divisor bg-transparent text-tinta-2 hover:border-tinta-3 hover:text-tinta",
        className,
      )}
      {...props}
    />
  );
}

export { Chip };
