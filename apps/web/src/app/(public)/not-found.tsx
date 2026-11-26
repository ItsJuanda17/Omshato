import type { Metadata } from "next";
import Link from "next/link";

import { EstadoVacio } from "@/components/feedback/estados";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Reloj no disponible",
  robots: { index: false },
};

/**
 * Se muestra cuando una página pública llama a `notFound()`: la ficha o el pedido
 * de un reloj oculto o inexistente (REQ-DET-6). No revela ningún dato del reloj.
 */
export default function NoEncontrado() {
  return (
    <div className="contenedor py-20">
      <EstadoVacio
        titulo="Este reloj ya no está disponible en el catálogo"
        descripcion="Puede que lo hayan retirado o que el enlace esté incompleto. Mira las demás piezas."
        accion={
          <Link href="/#catalogo" className={buttonVariants({ variant: "outline" })}>
            Ver el catálogo
          </Link>
        }
      />
    </div>
  );
}
