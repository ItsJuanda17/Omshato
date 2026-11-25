"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleAlertIcon, PlusIcon, SearchIcon } from "lucide-react";

import { CargandoPanel, ErrorPanel } from "@/components/admin/comun/cargando-panel";
import { Dialogo } from "@/components/admin/comun/dialogo";
import { EstadoVacio } from "@/components/feedback/estados";
import { InsigniaModo, etiquetasModo } from "@/components/relojes/insignia-modo";
import { Precio } from "@/components/relojes/precio";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cambiarModoReloj,
  cambiarVisibilidadReloj,
  eliminarReloj,
  listarRelojesAdmin,
} from "@/lib/api/relojes-admin";
import type { ModoReloj, RelojAdmin } from "@/lib/api/tipos";
import { normalizar } from "@/lib/formato";

type FiltroVisibilidad = "todos" | "visibles" | "ocultos";

const MODOS: ModoReloj[] = ["DISPONIBLE", "BAJO_PEDIDO"];

/** Contenido del diálogo de eliminación. Si hay pedidos, explica por qué no se puede. */
function ContenidoEliminar({
  reloj,
  alCerrar,
  alOcultar,
  alEliminar,
  eliminando,
  error,
}: {
  reloj: RelojAdmin;
  alCerrar: () => void;
  alOcultar: () => void;
  alEliminar: () => void;
  eliminando: boolean;
  error: string | null;
}) {
  const tienePedidos = reloj.cantidadPedidos > 0;

  return (
    <div className="space-y-5">
      {tienePedidos && (
        <p className="border border-linea p-4 text-body-md text-tinta-2">
          Este reloj tiene {reloj.cantidadPedidos}{" "}
          {reloj.cantidadPedidos === 1 ? "pedido asociado" : "pedidos asociados"}, así que no se
          puede eliminar. Puedes ocultarlo para que no aparezca en el catálogo.
        </p>
      )}
      {error && (
        <p role="alert" className="flex items-start gap-2 text-body-sm">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={alCerrar}>
          {tienePedidos ? "Cerrar" : "Cancelar"}
        </Button>
        {tienePedidos ? (
          reloj.visible && <Button onClick={alOcultar}>Ocultar reloj</Button>
        ) : (
          <Button onClick={alEliminar} disabled={eliminando}>
            {eliminando ? "Eliminando…" : "Sí, eliminar"}
          </Button>
        )}
      </div>
    </div>
  );
}

export function ListaRelojes() {
  const cliente = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [modo, setModo] = useState<ModoReloj | null>(null);
  const [visibilidad, setVisibilidad] = useState<FiltroVisibilidad>("todos");
  const [porEliminar, setPorEliminar] = useState<RelojAdmin | null>(null);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  const consulta = useQuery({ queryKey: ["relojes-admin"], queryFn: () => listarRelojesAdmin() });
  const refrescar = () => cliente.invalidateQueries({ queryKey: ["relojes-admin"] });

  const cambiarModo = useMutation({
    mutationFn: (datos: { id: number; modo: ModoReloj }) => cambiarModoReloj(datos.id, datos.modo),
    onSuccess: (resultado) => {
      setErrorAccion(resultado.ok ? null : resultado.mensaje);
      refrescar();
    },
    onError: () => setErrorAccion("No pudimos cambiar el modo. Inténtalo de nuevo."),
  });

  const cambiarVisibilidad = useMutation({
    mutationFn: (datos: { id: number; visible: boolean }) =>
      cambiarVisibilidadReloj(datos.id, datos.visible),
    onSuccess: (resultado) => {
      setErrorAccion(resultado.ok ? null : resultado.mensaje);
      refrescar();
      setPorEliminar(null);
    },
    onError: () => setErrorAccion("No pudimos cambiar la visibilidad. Inténtalo de nuevo."),
  });

  const eliminar = useMutation({
    mutationFn: (id: number) => eliminarReloj(id),
    onSuccess: (resultado) => {
      if (!resultado.ok) {
        setErrorEliminar(resultado.mensaje);
        return;
      }
      setPorEliminar(null);
      refrescar();
    },
    onError: () => setErrorEliminar("No pudimos eliminar el reloj. Inténtalo de nuevo."),
  });

  if (consulta.isPending) return <CargandoPanel mensaje="Cargando relojes" />;
  if (consulta.isError) return <ErrorPanel alReintentar={() => consulta.refetch()} />;

  const relojes = consulta.data;
  const texto = normalizar(busqueda);
  const visibles = relojes.filter(
    (reloj) =>
      (!modo || reloj.modo === modo) &&
      (visibilidad === "todos" || reloj.visible === (visibilidad === "visibles")) &&
      (!texto || normalizar(`${reloj.marca.nombre} ${reloj.nombre}`).includes(texto)),
  );
  const cantidadVisibles = relojes.filter((r) => r.visible).length;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="etiqueta">Catálogo</p>
          <h1 className="font-display text-headline-lg uppercase">Relojes</h1>
          <p className="text-body-sm text-tinta-3">
            {relojes.length} registrados · {cantidadVisibles} visibles en el catálogo
          </p>
        </div>
        <Link href="/admin/relojes/nuevo" className={buttonVariants()}>
          <PlusIcon aria-hidden="true" />
          Agregar reloj
        </Link>
      </header>

      <div className="space-y-5 border border-linea bg-superficie p-5">
        <div className="space-y-2">
          <Label htmlFor="busqueda-relojes" className="sr-only">
            Buscar por nombre o marca
          </Label>
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute top-1/2 left-5 size-4 -translate-y-1/2 text-tinta-3"
              aria-hidden="true"
            />
            <Input
              id="busqueda-relojes"
              type="search"
              value={busqueda}
              onChange={(evento) => setBusqueda(evento.target.value)}
              placeholder="Buscar por nombre o marca"
              autoComplete="off"
              className="pl-12"
            />
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          <fieldset>
            <legend className="etiqueta mb-3">Modo</legend>
            <div className="flex flex-wrap gap-2">
              <Chip activo={modo === null} onClick={() => setModo(null)}>
                Todos
              </Chip>
              {MODOS.map((m) => (
                <Chip key={m} activo={modo === m} onClick={() => setModo(m)}>
                  {etiquetasModo[m]}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="etiqueta mb-3">Visibilidad</legend>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["todos", "Todos"],
                  ["visibles", "Visibles"],
                  ["ocultos", "Ocultos"],
                ] as const
              ).map(([valor, etiqueta]) => (
                <Chip
                  key={valor}
                  activo={visibilidad === valor}
                  onClick={() => setVisibilidad(valor)}
                >
                  {etiqueta}
                </Chip>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      {errorAccion && (
        <p role="alert" className="flex items-start gap-2 border border-tinta p-4 text-body-md">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {errorAccion}
        </p>
      )}

      <p role="status" aria-live="polite" className="etiqueta">
        {visibles.length} {visibles.length === 1 ? "reloj" : "relojes"}
      </p>

      {visibles.length === 0 ? (
        <EstadoVacio
          variante="panel"
          titulo={relojes.length === 0 ? "Aún no hay relojes" : "Ningún reloj coincide"}
          descripcion={
            relojes.length === 0
              ? "Agrega el primero para publicarlo en el catálogo."
              : "Prueba con otros filtros o con otra búsqueda."
          }
        />
      ) : (
        <ul className="border-t border-linea">
          {visibles.map((reloj) => {
            const principal = reloj.imagenes.find((i) => i.esPrincipal) ?? reloj.imagenes[0];
            const otroModo: ModoReloj = reloj.modo === "DISPONIBLE" ? "BAJO_PEDIDO" : "DISPONIBLE";
            return (
              <li
                key={reloj.id}
                className="grid gap-x-6 gap-y-4 border-b border-linea px-2 py-5 md:grid-cols-[4.5rem_minmax(0,1.4fr)_9rem_auto] md:items-center"
              >
                <div className="relative hidden aspect-[4/5] w-[4.5rem] overflow-hidden border border-linea bg-carbon-2 md:block">
                  <Image
                    src={principal.archivo}
                    alt={`${reloj.marca.nombre} ${reloj.nombre}`}
                    fill
                    sizes="72px"
                    className="object-cover"
                  />
                </div>

                <div className="min-w-0 space-y-2">
                  <p className="etiqueta">{reloj.marca.nombre}</p>
                  <p className="truncate text-body-md text-tinta">{reloj.nombre}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <InsigniaModo modo={reloj.modo} />
                    <Badge variant={reloj.visible ? "activo" : "default"}>
                      {reloj.visible ? "Visible" : "Oculto"}
                    </Badge>
                    {reloj.cantidadPedidos > 0 && (
                      <span className="text-body-sm text-tinta-3">
                        {reloj.cantidadPedidos} {reloj.cantidadPedidos === 1 ? "pedido" : "pedidos"}
                      </span>
                    )}
                  </div>
                </div>

                <Precio valor={reloj.precioCop} className="text-body-md text-tinta md:text-right" />

                <div className="flex flex-wrap gap-2 md:justify-end">
                  <Link
                    href={`/admin/relojes/${reloj.id}`}
                    className={buttonVariants({ variant: "ghost", size: "sm" })}
                  >
                    Editar
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cambiarModo.isPending}
                    onClick={() => cambiarModo.mutate({ id: reloj.id, modo: otroModo })}
                  >
                    Pasar a {etiquetasModo[otroModo].toLowerCase()}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={cambiarVisibilidad.isPending}
                    onClick={() =>
                      cambiarVisibilidad.mutate({ id: reloj.id, visible: !reloj.visible })
                    }
                  >
                    {reloj.visible ? "Ocultar" : "Mostrar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setErrorEliminar(null);
                      setPorEliminar(reloj);
                    }}
                  >
                    Eliminar
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Dialogo
        abierto={porEliminar !== null}
        alCerrar={() => setPorEliminar(null)}
        titulo="Eliminar reloj"
        descripcion={
          porEliminar
            ? porEliminar.cantidadPedidos > 0
              ? `${porEliminar.marca.nombre} ${porEliminar.nombre}`
              : `Vas a eliminar ${porEliminar.marca.nombre} ${porEliminar.nombre}. Esta acción no se puede deshacer.`
            : undefined
        }
      >
        {porEliminar && (
          <ContenidoEliminar
            reloj={porEliminar}
            alCerrar={() => setPorEliminar(null)}
            alOcultar={() => cambiarVisibilidad.mutate({ id: porEliminar.id, visible: false })}
            alEliminar={() => eliminar.mutate(porEliminar.id)}
            eliminando={eliminar.isPending}
            error={errorEliminar}
          />
        )}
      </Dialogo>
    </div>
  );
}
