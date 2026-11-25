import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-28 w-full resize-y rounded-none border border-linea bg-carbon-2 px-5 py-4 text-body-md text-tinta transition-colors outline-none placeholder:text-tenue focus-visible:border-tinta focus-visible:shadow-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-dashed aria-invalid:border-tinta",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
