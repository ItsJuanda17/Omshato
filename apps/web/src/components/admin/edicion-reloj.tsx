"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeftIcon } from "lucide-react";

import { CargandoPanel, ErrorPanel } from "@/components/admin/cargando-panel";
import { FormularioReloj } from "@/components/admin/formulario-reloj";
import { EstadoVacio } from "@/components/feedback/estados";
import { listarMarcasAdmin, obtenerRelojAdmin } from "@/lib/api/relojes-admin";

/** Carga lo que necesita el formulario y lo muestra para agregar o editar un reloj. */
export function EdicionReloj({ idReloj }: { idReloj?: number }) {
  const editando = idReloj !== undefined;
  const marcas = useQuery({ queryKey: ["marcas-admin"], queryFn: () => listarMarcasAdmin() });
  const reloj = useQuery({
    queryKey: ["reloj-admin", idReloj],
    queryFn: () => obtenerRelojAdmin(idReloj as number),
    enabled: editando && Number.isInteger(idReloj),
    // Siempre parte del dato más reciente: es un formulario de edición.
    staleTime: 0,
    gcTime: 0,
  });

  const volver = (
    <Link
      href="/admin/relojes"
      className="etiqueta inline-flex items-center gap-2 transition-colors hover:text-tinta"
    >
      <ArrowLeftIcon className="size-4" aria-hidden="true" />
      Relojes
    </Link>
  );

  if (marcas.isPending || (editando && reloj.isPending && Number.isInteger(idReloj))) {
    return <CargandoPanel mensaje="Cargando" />;
  }
  if (marcas.isError || reloj.isError) {
    return <ErrorPanel alReintentar={() => (marcas.isError ? marcas.refetch() : reloj.refetch())} />;
  }
  if (editando && !reloj.data) {
    return (
      <div className="space-y-8">
        {volver}
        <EstadoVacio variante="panel" titulo="No encontramos ese reloj" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-10">
      {volver}
      <header className="space-y-2">
        <p className="etiqueta">Catálogo</p>
        <h1 className="font-display text-headline-lg uppercase">
          {editando ? "Editar reloj" : "Agregar reloj"}
        </h1>
        {editando && reloj.data && (
          <p className="text-body-sm text-tinta-3">
            Los pedidos ya hechos conservan el nombre y el precio con que se compraron.
          </p>
        )}
      </header>
      <FormularioReloj marcas={marcas.data} reloj={reloj.data ?? undefined} />
    </div>
  );
}
