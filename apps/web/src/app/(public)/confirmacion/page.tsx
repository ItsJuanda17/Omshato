import type { Metadata } from "next";

import { ConfirmacionPedido } from "@/components/pedido/confirmacion-pedido";
import { contactoPublico } from "@/lib/contacto-servidor";

export const metadata: Metadata = {
  title: "Pedido recibido",
  robots: { index: false },
};

export default async function PaginaConfirmacion() {
  const { whatsapp } = await contactoPublico();

  return (
    <div className="contenedor py-12 md:py-20">
      <ConfirmacionPedido whatsapp={whatsapp} />
    </div>
  );
}
