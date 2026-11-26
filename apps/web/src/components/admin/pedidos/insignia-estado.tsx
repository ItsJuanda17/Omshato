import {
  CircleCheckIcon,
  ClockIcon,
  InboxIcon,
  PackageCheckIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { EstadoPedido } from "@/lib/api/tipos";
import { etiquetasEstado } from "@/lib/pedidos/estados";
import { cn } from "@/lib/utils";

const iconos = {
  RECIBIDO: InboxIcon,
  POR_CONSEGUIR_CON_PROVEEDOR: ClockIcon,
  CONFIRMADO: CircleCheckIcon,
  ENVIADO: TruckIcon,
  ENTREGADO: PackageCheckIcon,
  CANCELADO: XIcon,
} satisfies Record<EstadoPedido, unknown>;

/** Estado del pedido. Se distingue por icono y por luminosidad, sin color. */
export function InsigniaEstado({
  estado,
  className,
}: {
  estado: EstadoPedido;
  className?: string;
}) {
  const Icono = iconos[estado];
  return (
    <Badge
      variant={estado === "ENTREGADO" ? "solido" : estado === "CANCELADO" ? "default" : "activo"}
      className={cn(
        "whitespace-normal",
        estado === "CANCELADO" && "text-tinta-3 line-through",
        className,
      )}
    >
      <Icono className="size-3" aria-hidden="true" />
      {etiquetasEstado[estado]}
    </Badge>
  );
}
