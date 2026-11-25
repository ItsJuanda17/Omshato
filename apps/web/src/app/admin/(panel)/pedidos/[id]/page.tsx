import type { Metadata } from "next";

import { DetallePedido } from "@/components/admin/detalle-pedido";

export const metadata: Metadata = { title: "Detalle del pedido" };

export default async function PaginaDetallePedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DetallePedido idPedido={Number(id)} />;
}
