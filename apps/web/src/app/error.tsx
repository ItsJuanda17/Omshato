"use client";

import { EstadoVacio } from "@/components/feedback/estados";
import { Button } from "@/components/ui/button";

/**
 * Lo que ve la persona si el servidor no puede traer los datos, por ejemplo si el API está
 * caído. No muestra detalles técnicos: el error completo queda en el registro del servidor.
 */
export default function ErrorGeneral({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
      <EstadoVacio
        titulo="No pudimos cargar esta página"
        descripcion="Algo falló de nuestro lado. Tus datos no se perdieron: inténtalo de nuevo en un momento."
        accion={<Button onClick={reset}>Reintentar</Button>}
      />
    </main>
  );
}
