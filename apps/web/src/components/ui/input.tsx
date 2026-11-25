import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "h-12 w-full min-w-0 rounded-none border border-linea bg-carbon-2 px-5 text-body-md text-tinta transition-colors outline-none placeholder:text-tenue focus-visible:border-tinta focus-visible:shadow-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-tinta aria-invalid:border-dashed",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
