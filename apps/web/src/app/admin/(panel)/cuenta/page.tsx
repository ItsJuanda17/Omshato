import type { Metadata } from "next";

import { FormularioCambioContrasena } from "@/components/admin/sesion/formulario-cambio-contrasena";
import { requerirSesion } from "@/lib/auth/sesion";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function PaginaCuenta() {
  const sesion = await requerirSesion();

  return (
    <div className="max-w-xl space-y-10">
      <header className="space-y-2">
        <p className="etiqueta">{sesion.correo}</p>
        <h1 className="font-display text-headline-lg uppercase">Mi cuenta</h1>
        <p className="text-body-md text-tinta-2">
          Cambia la contraseña con la que entras al panel. Al guardarla se cierra la sesión en los
          demás dispositivos.
        </p>
      </header>
      <FormularioCambioContrasena />
    </div>
  );
}
