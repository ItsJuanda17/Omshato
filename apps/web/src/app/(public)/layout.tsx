import { CabeceraPublica } from "@/components/layout/cabecera-publica";
import { PiePublico } from "@/components/layout/pie-publico";

// Los enlaces de contacto del pie los edita el administrador, así que el sitio
// público no se prerenderiza.
export const dynamic = "force-dynamic";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CabeceraPublica />
      <main id="contenido" className="flex-1">
        {children}
      </main>
      <PiePublico />
    </>
  );
}
