import { Badge } from "@/components/ui/badge";
import type { ModoReloj } from "@/lib/api/tipos";

export const etiquetasModo: Record<ModoReloj, string> = {
  DISPONIBLE: "Disponible",
  BAJO_PEDIDO: "Bajo pedido",
};

/** Indica si el reloj está en mano o se consigue con un proveedor (REQ-CAT-2). */
export function InsigniaModo({ modo, className }: { modo: ModoReloj; className?: string }) {
  return (
    <Badge variant={modo === "DISPONIBLE" ? "activo" : "default"} className={className}>
      {etiquetasModo[modo]}
    </Badge>
  );
}
