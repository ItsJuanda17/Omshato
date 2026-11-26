import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-none border px-2.5 py-1 font-sans text-label-sm uppercase",
  {
    variants: {
      variant: {
        /** Etiqueta neutra con línea fina. */
        default: "border-divisor bg-superficie text-tinta-2",
        /** Estado destacado: invierte los colores. */
        solido: "border-tinta bg-tinta text-carbon",
        /** Estado activo o seleccionado. */
        activo: "border-tinta bg-superficie text-tinta",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">({ className: cn(badgeVariants({ variant }), className) }, props),
    render,
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
