import { formatoCOP } from "@/lib/formato";
import { cn } from "@/lib/utils";

/** Precio en pesos colombianos, con la moneda rotulada. */
export function Precio({ valor, className }: { valor: number; className?: string }) {
  return (
    <span className={cn("dato whitespace-nowrap", className)}>
      {formatoCOP(valor)} <span className="text-[0.65em] text-tinta-3">COP</span>
    </span>
  );
}
