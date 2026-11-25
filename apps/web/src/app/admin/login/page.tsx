import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Engranaje } from "@/components/brand/engranajes";
import { Logo } from "@/components/brand/logo";
import { FormularioLogin } from "@/components/admin/formulario-login";
import { obtenerSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = { title: "Iniciar sesión" };
export const dynamic = "force-dynamic";

export default async function PaginaLogin() {
  // Quien ya tiene sesión no necesita ver el formulario.
  if (await obtenerSesion()) redirect("/admin/pedidos");

  return (
    <main
      id="contenido"
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16"
    >
      <Engranaje
        dientes={20}
        giro="horaria"
        duracion={200}
        className="absolute -right-40 -bottom-40 w-[28rem] opacity-[0.08]"
      />
      <div className="relative w-full max-w-sm space-y-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo variante="vertical" />
          <p className="etiqueta">Panel de administración</p>
        </div>
        <FormularioLogin />
      </div>
    </main>
  );
}
