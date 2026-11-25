import type { Metadata } from "next";

import { ListaRelojes } from "@/components/admin/relojes/lista-relojes";

export const metadata: Metadata = { title: "Relojes" };

export default function PaginaRelojes() {
  return <ListaRelojes />;
}
