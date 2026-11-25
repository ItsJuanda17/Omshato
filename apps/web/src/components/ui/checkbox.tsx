"use client";

import { Checkbox as CheckboxPrimitive } from "@base-ui/react/checkbox";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        "relative flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-none border border-tenue bg-transparent transition-colors outline-none after:absolute after:-inset-2 disabled:cursor-not-allowed disabled:opacity-40 aria-invalid:border-dashed aria-invalid:border-tinta data-checked:border-tinta data-checked:bg-tinta data-checked:text-carbon",
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator className="grid place-content-center text-current">
        <CheckIcon className="size-3" strokeWidth={3} />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}

export { Checkbox };
