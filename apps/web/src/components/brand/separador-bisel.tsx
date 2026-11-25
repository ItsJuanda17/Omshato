import { cn } from "@/lib/utils";

/**
 * Separador con marcas de minutero: una línea de 1px con marcas cada 8px
 * y una marca mayor cada 40px, como el bisel de un reloj.
 */
export function SeparadorBisel({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("h-2 w-full", className)}
      style={{
        backgroundRepeat: "no-repeat, repeat-x, repeat-x",
        backgroundSize: "100% 1px, 8px 4px, 40px 8px",
        backgroundImage: [
          "linear-gradient(var(--divisor), var(--divisor))",
          "linear-gradient(90deg, var(--divisor) 1px, transparent 1px)",
          "linear-gradient(90deg, var(--tenue) 1px, transparent 1px)",
        ].join(", "),
      }}
    />
  );
}
