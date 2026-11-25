import { CabeceraPublica } from "@/components/layout/cabecera-publica";
import { PiePublico } from "@/components/layout/pie-publico";

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
