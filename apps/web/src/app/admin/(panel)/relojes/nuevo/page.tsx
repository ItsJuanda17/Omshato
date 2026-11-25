import type { Metadata } from "next";

import { EdicionReloj } from "@/components/admin/edicion-reloj";

export const metadata: Metadata = { title: "Agregar reloj" };

export default function PaginaNuevoReloj() {
  return <EdicionReloj />;
}
