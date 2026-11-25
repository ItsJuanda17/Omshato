import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-boton border font-sans text-label-lg uppercase transition-colors duration-150 select-none disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /** Acción principal: blanco sólido. */
        default: "border-tinta bg-tinta text-carbon hover:border-[#d4d4d4] hover:bg-[#d4d4d4]",
        /** Acción secundaria: línea fina blanca que se invierte al pasar. */
        outline: "border-tinta bg-transparent text-tinta hover:bg-tinta hover:text-carbon",
        /** Acción discreta dentro de tablas y paneles. */
        ghost: "border-linea bg-transparent text-tinta-2 hover:border-tinta hover:text-tinta",
        /** Acción terciaria: texto con subrayado fino. */
        link: "rounded-none border-transparent bg-transparent px-0! py-0! text-tinta underline decoration-tenue decoration-1 underline-offset-[6px] hover:decoration-tinta",
      },
      size: {
        default: "min-h-11 px-8 py-3.5",
        sm: "min-h-9 px-4 py-2",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
