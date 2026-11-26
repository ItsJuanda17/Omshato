import type { Metadata } from "next";

import { FormularioEnlaces } from "@/components/admin/enlaces/formulario-enlaces";

export const metadata: Metadata = { title: "Enlaces de contacto" };

export default function PaginaEnlaces() {
  return (
    <div className="max-w-2xl space-y-10">
      <header className="space-y-2">
        <p className="etiqueta">Sitio público</p>
        <h1 className="font-display text-headline-lg uppercase">Enlaces de contacto</h1>
        <p className="text-body-md text-tinta-2">
          Los datos que aparecen en el pie de página, en la ficha de cada reloj y en los botones de
          WhatsApp.
        </p>
      </header>
      <FormularioEnlaces />
    </div>
  );
}
