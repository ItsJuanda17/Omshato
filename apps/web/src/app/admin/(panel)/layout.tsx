import { MarcoPanel } from "@/components/admin/marco-panel";
import { ProveedorConsultas } from "@/components/admin/proveedor-consultas";
import { requerirSesion } from "@/lib/auth/sesion";

// Todo el panel, salvo el inicio de sesión, exige sesión (REQ-AUT-1).
export const dynamic = "force-dynamic";

export default async function LayoutPanel({ children }: { children: React.ReactNode }) {
  const sesion = await requerirSesion();

  return (
    <ProveedorConsultas>
      <MarcoPanel nombre={sesion.nombre}>{children}</MarcoPanel>
    </ProveedorConsultas>
  );
}
