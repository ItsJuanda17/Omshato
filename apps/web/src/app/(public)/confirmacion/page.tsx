import type { Metadata } from "next";

import { ConfirmacionPedido } from "@/components/pedido/confirmacion-pedido";

export const metadata: Metadata = {
  title: "Pedido recibido",
  robots: { index: false },
};

export default function PaginaConfirmacion() {
  return (
    <div className="contenedor py-12 md:py-20">
      <ConfirmacionPedido />
    </div>
  );
}
