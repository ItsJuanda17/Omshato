import type { Metadata } from "next";

import { EdicionReloj } from "@/components/admin/relojes/edicion-reloj";

export const metadata: Metadata = { title: "Editar reloj" };

export default async function PaginaEditarReloj({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EdicionReloj idReloj={Number(id)} />;
}
