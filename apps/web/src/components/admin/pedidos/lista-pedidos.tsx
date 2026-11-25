"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon } from "lucide-react";

import { CargandoPanel, ErrorPanel } from "@/components/admin/cargando-panel";
import { InsigniaEstado } from "@/components/admin/insignia-estado";
import { EstadoVacio } from "@/components/feedback/estados";
import { Precio } from "@/components/relojes/precio";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { listarPedidos } from "@/lib/api/pedidos";
import type { EstadoPedido } from "@/lib/api/tipos";
import { formatoFechaHora, normalizar } from "@/lib/formato";
import { estadosEnOrden, etiquetasEstado } from "@/lib/pedidos/estados";

export function ListaPedidos() {
  const [estado, setEstado] = useState<EstadoPedido | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const consulta = useQuery({ queryKey: ["pedidos"], queryFn: () => listarPedidos() });

  if (consulta.isPending) return <CargandoPanel mensaje="Cargando pedidos" />;
  if (consulta.isError) return <ErrorPanel alReintentar={() => consulta.refetch()} />;

  const pedidos = consulta.data;
  const texto = normalizar(busqueda);
  const visibles = pedidos.filter(
    (pedido) =>
      (!estado || pedido.estado === estado) &&
      (!texto ||
        normalizar(
          `${pedido.numeroPedido} ${pedido.nombreComprador} ${pedido.nombreReloj}`,
        ).includes(texto)),
  );
  const cuenta = (e: EstadoPedido) => pedidos.filter((p) => p.estado === e).length;

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="etiqueta">Gestión</p>
        <h1 className="font-display text-headline-lg uppercase">Pedidos</h1>
      </header>

      <div className="space-y-5 border border-linea bg-superficie p-5">
        <div className="space-y-2">
          <Label htmlFor="busqueda-pedidos" className="sr-only">
            Buscar por número, comprador o reloj
          </Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-tinta-3"
              aria-hidden="true"
            />
            <Input
              id="busqueda-pedidos"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por número, comprador o reloj"
              autoComplete="off"
              className="pl-12"
            />
          </div>
        </div>
        <fieldset>
          <legend className="etiqueta mb-3">Estado</legend>
          <div className="flex flex-wrap gap-2">
            <Chip activo={estado === null} onClick={() => setEstado(null)}>
              Todos ({pedidos.length})
            </Chip>
            {estadosEnOrden.map((e) => (
              <Chip key={e} activo={estado === e} onClick={() => setEstado(e)}>
                {etiquetasEstado[e]} ({cuenta(e)})
              </Chip>
            ))}
          </div>
        </fieldset>
      </div>

      <p role="status" aria-live="polite" className="etiqueta">
        {visibles.length} {visibles.length === 1 ? "pedido" : "pedidos"}
      </p>

      {visibles.length === 0 ? (
        <EstadoVacio
          variante="panel"
          titulo={pedidos.length === 0 ? "Aún no hay pedidos" : "Ningún pedido coincide"}
          descripcion={
            pedidos.length === 0
              ? "Cuando alguien haga un pedido, aparecerá aquí."
              : "Prueba con otro estado o con otra búsqueda."
          }
        />
      ) : (
        <ul className="border-t border-linea">
          {visibles.map((pedido) => (
            <li key={pedido.id} className="border-b border-linea">
              <Link
                href={`/admin/pedidos/${pedido.id}`}
                className="grid grid-cols-2 gap-x-6 gap-y-3 px-2 py-5 transition-colors hover:bg-superficie xl:grid-cols-[6.5rem_minmax(0,1.3fr)_minmax(0,1fr)_10rem_13rem] xl:items-center"
              >
                <span className="dato order-1 text-body-md text-tinta">{pedido.numeroPedido}</span>
                <span className="order-2 justify-self-end xl:order-5">
                  <InsigniaEstado estado={pedido.estado} />
                </span>
                <span className="order-3 col-span-2 min-w-0 xl:order-2 xl:col-span-1">
                  <span className="block truncate text-body-md text-tinta">
                    {pedido.nombreReloj}
                  </span>
                  <span className="dato block text-body-sm text-tinta-3">
                    {formatoFechaHora(pedido.fechaCreacion)}
                  </span>
                </span>
                <span className="order-4 min-w-0 xl:order-3">
                  <span className="block truncate text-body-md text-tinta">
                    {pedido.nombreComprador}
                  </span>
                  <span className="block truncate text-body-sm text-tinta-3">
                    {pedido.ciudad.nombre}
                  </span>
                </span>
                <Precio
                  valor={pedido.precioReloj}
                  className="order-5 self-start justify-self-end text-body-md text-tinta xl:order-4 xl:self-center"
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
