import type { Metadata } from "next";

import { ListaPedidos } from "@/components/admin/lista-pedidos";

export const metadata: Metadata = { title: "Pedidos" };

export default function PaginaPedidos() {
  return <ListaPedidos />;
}
