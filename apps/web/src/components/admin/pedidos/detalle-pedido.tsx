"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeftIcon, CircleAlertIcon, MessageCircleIcon, LockIcon } from "lucide-react";

import { CargandoPanel, ErrorPanel } from "@/components/admin/comun/cargando-panel";
import { Dialogo } from "@/components/admin/comun/dialogo";
import { InsigniaEstado } from "@/components/admin/pedidos/insignia-estado";
import { EstadoVacio } from "@/components/feedback/estados";
import { InsigniaModo } from "@/components/relojes/insignia-modo";
import { Precio } from "@/components/relojes/precio";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { agregarNotaPedido, cambiarEstadoPedido, obtenerPedido } from "@/lib/api/pedidos";
import type { EstadoPedido, Pedido } from "@/lib/api/tipos";
import { enlaceWhatsAppComprador } from "@/lib/contacto/enlaces";
import { formatoFechaHora } from "@/lib/formato";
import { etiquetasEstado, transiciones } from "@/lib/pedidos/estados";
import { esquemaMotivoCancelacion, esquemaNota } from "@/lib/validaciones/pedido";

const accionesPorEstado: Partial<Record<EstadoPedido, string>> = {
  CONFIRMADO: "Confirmar pedido",
  ENVIADO: "Marcar como enviado",
  ENTREGADO: "Marcar como entregado",
  CANCELADO: "Cancelar pedido",
};

function useActualizarPedido(idPedido: number) {
  const cliente = useQueryClient();
  return (pedido: Pedido) => {
    cliente.setQueryData(["pedido", idPedido], pedido);
    cliente.invalidateQueries({ queryKey: ["pedidos"] });
  };
}

function Dato({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="etiqueta">{etiqueta}</dt>
      <dd className="text-body-md text-tinta">{children}</dd>
    </div>
  );
}

/** Contenido del diálogo de cambio de estado. Se monta al abrirlo, así empieza vacío. */
function ContenidoCambioEstado({
  pedido,
  destino,
  alCerrar,
}: {
  pedido: Pedido;
  destino: EstadoPedido;
  alCerrar: () => void;
}) {
  const actualizar = useActualizarPedido(pedido.id);
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cancelando = destino === "CANCELADO";

  const cambio = useMutation({
    mutationFn: cambiarEstadoPedido,
    onSuccess: (resultado) => {
      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }
      actualizar(resultado.dato);
      alCerrar();
    },
    onError: () => setError("No pudimos cambiar el estado. Inténtalo de nuevo."),
  });

  function confirmar() {
    setError(null);
    if (cancelando) {
      // REQ-GPE-6: cancelar exige un motivo breve.
      const validacion = esquemaMotivoCancelacion.safeParse(motivo);
      if (!validacion.success) {
        setError(validacion.error.issues[0].message);
        return;
      }
    }
    cambio.mutate({
      idPedido: pedido.id,
      estado: destino,
      motivo: cancelando ? motivo : undefined,
    });
  }

  return (
    <div className="space-y-5">
      {destino === "CONFIRMADO" && pedido.modoReloj === "BAJO_PEDIDO" && (
        <p className="border border-linea p-4 text-body-sm text-tinta-2">
          Confirma solo si ya conseguiste el reloj con el proveedor y el comprador aceptó el precio
          y el plazo.
        </p>
      )}

      {cancelando && (
        <div className="space-y-2">
          <Label htmlFor="motivo-cancelacion">Motivo de la cancelación</Label>
          <Textarea
            id="motivo-cancelacion"
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            maxLength={250}
            rows={3}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "error-cambio-estado" : undefined}
            placeholder="Por ejemplo: el proveedor no pudo conseguir el reloj"
          />
        </div>
      )}

      {error && (
        <p id="error-cambio-estado" role="alert" className="flex items-start gap-2 text-body-sm">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={alCerrar} disabled={cambio.isPending}>
          {cancelando ? "Volver" : "Cancelar"}
        </Button>
        <Button onClick={confirmar} disabled={cambio.isPending}>
          {cambio.isPending
            ? "Guardando…"
            : cancelando
              ? "Sí, cancelar el pedido"
              : "Sí, cambiar estado"}
        </Button>
      </div>
    </div>
  );
}

function FormularioNota({ idPedido }: { idPedido: number }) {
  const actualizar = useActualizarPedido(idPedido);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  const agregar = useMutation({
    mutationFn: agregarNotaPedido,
    onSuccess: (resultado) => {
      if (!resultado.ok) {
        setError(resultado.mensaje);
        return;
      }
      actualizar(resultado.dato);
      setTexto("");
    },
    onError: () => setError("No pudimos guardar la nota. Inténtalo de nuevo."),
  });

  function guardar(evento: React.FormEvent) {
    evento.preventDefault();
    setError(null);
    const validacion = esquemaNota.safeParse(texto);
    if (!validacion.success) {
      setError(validacion.error.issues[0].message);
      return;
    }
    agregar.mutate({ idPedido, texto });
  }

  return (
    <form onSubmit={guardar} noValidate className="space-y-3">
      <Label htmlFor="nota-interna">Nueva nota interna</Label>
      <Textarea
        id="nota-interna"
        value={texto}
        onChange={(evento) => setTexto(evento.target.value)}
        maxLength={1000}
        rows={3}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? "error-nota" : undefined}
        placeholder="Proveedor consultado, plazo acordado…"
      />
      {error && (
        <p id="error-nota" role="alert" className="flex items-start gap-2 text-body-sm">
          <CircleAlertIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}
      <Button type="submit" variant="outline" size="sm" disabled={agregar.isPending}>
        {agregar.isPending ? "Guardando…" : "Agregar nota"}
      </Button>
    </form>
  );
}

export function DetallePedido({ idPedido }: { idPedido: number }) {
  const [destino, setDestino] = useState<EstadoPedido | null>(null);
  const consulta = useQuery({
    queryKey: ["pedido", idPedido],
    queryFn: () => obtenerPedido(idPedido),
    enabled: Number.isInteger(idPedido),
  });

  const volver = (
    <Link
      href="/admin/pedidos"
      className="etiqueta inline-flex items-center gap-2 transition-colors hover:text-tinta"
    >
      <ArrowLeftIcon className="size-4" aria-hidden="true" />
      Pedidos
    </Link>
  );

  if (consulta.isPending && Number.isInteger(idPedido)) {
    return <CargandoPanel mensaje="Cargando pedido" />;
  }
  if (consulta.isError) return <ErrorPanel alReintentar={() => consulta.refetch()} />;

  const pedido = consulta.data;
  if (!pedido) {
    return (
      <div className="space-y-8">
        {volver}
        <EstadoVacio variante="panel" titulo="No encontramos ese pedido" />
      </div>
    );
  }

  const siguientes = transiciones[pedido.estado];
  const primerNombre = pedido.nombreComprador.split(" ")[0];
  const enlaceChat = enlaceWhatsAppComprador(
    pedido.telefonoComprador,
    `Hola ${primerNombre}, te escribimos de Omshato por tu pedido ${pedido.numeroPedido} (${pedido.nombreReloj}).`,
  );

  return (
    <div className="space-y-10">
      {volver}

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="etiqueta">Pedido</p>
          <h1 className="dato text-headline-lg text-tinta">{pedido.numeroPedido}</h1>
          <p className="dato text-body-sm text-tinta-3">{formatoFechaHora(pedido.fechaCreacion)}</p>
        </div>
        <InsigniaEstado estado={pedido.estado} />
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-10">
          <section aria-labelledby="titulo-reloj" className="space-y-4 border border-linea p-6">
            <h2 id="titulo-reloj" className="etiqueta">
              Reloj pedido
            </h2>
            <p className="font-display text-headline-sm uppercase">{pedido.nombreReloj}</p>
            <div className="flex flex-wrap items-center gap-4">
              <InsigniaModo modo={pedido.modoReloj} />
              <Precio valor={pedido.precioReloj} className="text-title-lg text-tinta" />
            </div>
            <p className="text-body-sm text-tinta-3">
              Nombre y precio tal como estaban al hacer el pedido.{" "}
              <Link
                href={`/admin/relojes/${pedido.idReloj}`}
                className="text-tinta underline underline-offset-4"
              >
                Ver el reloj
              </Link>
            </p>
          </section>

          <section aria-labelledby="titulo-comprador" className="space-y-5 border border-linea p-6">
            <h2 id="titulo-comprador" className="etiqueta">
              Comprador y entrega
            </h2>
            <dl className="grid gap-5 sm:grid-cols-2">
              <Dato etiqueta="Nombre">{pedido.nombreComprador}</Dato>
              <Dato etiqueta="Celular">
                <span className="dato">+57 {pedido.telefonoComprador}</span>
              </Dato>
              <Dato etiqueta="Ciudad">
                {pedido.ciudad.nombre}, {pedido.departamento.nombre}
              </Dato>
              <Dato etiqueta="Dirección">{pedido.direccion}</Dato>
              <Dato etiqueta="Autorizó el tratamiento de datos">
                <span className="dato">{formatoFechaHora(pedido.fechaAutorizacionDatos)}</span>
              </Dato>
            </dl>
          </section>

          <section aria-labelledby="titulo-historial" className="space-y-5">
            <h2 id="titulo-historial" className="etiqueta">
              Historial de estados
            </h2>
            <ol className="space-y-6 border-l border-divisor pl-6">
              {pedido.historial.map((paso) => (
                <li key={paso.id} className="relative space-y-1.5">
                  <span
                    aria-hidden="true"
                    className="absolute top-1.5 -left-[1.9rem] size-2 bg-tinta"
                  />
                  <InsigniaEstado estado={paso.estado} />
                  <p className="dato text-body-sm text-tinta-3">
                    {formatoFechaHora(paso.fechaHora)} ·{" "}
                    {paso.idAdministrador === null ? "Sistema" : "Administrador"}
                  </p>
                </li>
              ))}
            </ol>
            {pedido.estado === "CANCELADO" && pedido.motivoCancelacion && (
              <p className="border border-linea p-4 text-body-md text-tinta-2">
                <span className="etiqueta mb-1 block">Motivo de la cancelación</span>
                {pedido.motivoCancelacion}
              </p>
            )}
          </section>

          <section aria-labelledby="titulo-notas" className="space-y-5">
            <h2 id="titulo-notas" className="etiqueta flex items-center gap-2">
              Notas internas
              <LockIcon className="size-3" aria-hidden="true" />
              <span className="sr-only">(el comprador no las ve)</span>
            </h2>
            {pedido.notas.length > 0 ? (
              <ul className="space-y-3">
                {pedido.notas.map((nota) => (
                  <li key={nota.id} className="space-y-2 border border-linea bg-superficie p-4">
                    <p className="text-body-md whitespace-pre-line text-tinta">{nota.texto}</p>
                    <p className="dato text-body-sm text-tinta-3">
                      {formatoFechaHora(nota.fechaHora)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-body-md text-tinta-3">Todavía no hay notas.</p>
            )}
            <FormularioNota idPedido={pedido.id} />
          </section>
        </div>

        <aside
          aria-label="Acciones del pedido"
          className="space-y-6 lg:sticky lg:top-6 lg:self-start"
        >
          <div className="space-y-3 border border-linea bg-superficie p-5">
            <h2 className="etiqueta">Cambiar estado</h2>
            {siguientes.length > 0 ? (
              <div className="flex flex-col gap-3">
                {siguientes.map((siguiente) => (
                  <Button
                    key={siguiente}
                    variant={siguiente === "CANCELADO" ? "ghost" : "default"}
                    onClick={() => setDestino(siguiente)}
                  >
                    {accionesPorEstado[siguiente]}
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-tinta-3">
                «{etiquetasEstado[pedido.estado]}» es un estado final. Ya no se puede cambiar.
              </p>
            )}
            {pedido.estado === "ENVIADO" && (
              <p className="text-body-sm text-tinta-3">
                Un pedido enviado ya no se puede cancelar.
              </p>
            )}
          </div>

          <a
            href={enlaceChat}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline", className: "w-full" })}
          >
            <MessageCircleIcon aria-hidden="true" />
            Contactar por WhatsApp
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </aside>
      </div>

      <Dialogo
        abierto={destino !== null}
        alCerrar={() => setDestino(null)}
        titulo={destino === "CANCELADO" ? "Cancelar el pedido" : "Cambiar el estado"}
        descripcion={
          destino
            ? destino === "CANCELADO"
              ? `Vas a cancelar el pedido ${pedido.numeroPedido}. Esta acción no se puede deshacer.`
              : `El pedido ${pedido.numeroPedido} pasará a «${etiquetasEstado[destino]}». Esta acción no se puede deshacer.`
            : undefined
        }
      >
        {destino && (
          <ContenidoCambioEstado
            pedido={pedido}
            destino={destino}
            alCerrar={() => setDestino(null)}
          />
        )}
      </Dialogo>
    </div>
  );
}
