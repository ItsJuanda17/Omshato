"use client";

import Link from "next/link";
import { CircleCheckIcon, MessageCircleIcon } from "lucide-react";

import { Cargando, EstadoVacio } from "@/components/feedback/estados";
import { InsigniaModo } from "@/components/relojes/insignia-modo";
import { Precio } from "@/components/relojes/precio";
import { buttonVariants } from "@/components/ui/button";
import { contacto } from "@/config/contacto";
import { enlaceWhatsApp } from "@/lib/contacto";
import { usePedidoReciente } from "@/lib/pedido-reciente";

/** Pantalla de confirmación (REQ-PED-8): número de pedido, resumen y siguiente paso. */
export function ConfirmacionPedido() {
  const pedido = usePedidoReciente();

  if (pedido === undefined) return <Cargando mensaje="Buscando tu pedido" />;

  if (pedido === null) {
    return (
      <EstadoVacio
        titulo="No encontramos un pedido reciente"
        descripcion="Si acabas de hacer un pedido, escríbenos con tu número de pedido. Si no, mira el catálogo."
        accion={
          <Link href="/#catalogo" className={buttonVariants({ variant: "outline" })}>
            Ver el catálogo
          </Link>
        }
      />
    );
  }

  const bajoPedido = pedido.modoReloj === "BAJO_PEDIDO";

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <header className="space-y-5 text-center">
        <CircleCheckIcon className="mx-auto size-10" strokeWidth={1.25} aria-hidden="true" />
        <p className="etiqueta">Pedido recibido</p>
        <h1 className="font-display text-display-md-mobile uppercase md:text-display-md">
          Gracias por tu pedido
        </h1>
        <div className="mx-auto inline-flex flex-col items-center gap-2 border border-linea bg-superficie px-8 py-5">
          <span className="etiqueta">Número de pedido</span>
          <span className="dato text-headline-lg text-tinta">{pedido.numeroPedido}</span>
        </div>
        <p className="text-body-md text-tinta-2">
          Guarda este número: te sirve si nos escribes por cualquier canal.
        </p>
      </header>

      <section aria-labelledby="siguiente-paso" className="space-y-3 border border-linea p-6">
        <h2 id="siguiente-paso" className="font-display text-headline-sm uppercase">
          Qué sigue
        </h2>
        <p className="text-body-md text-tinta-2">
          {bajoPedido
            ? "Este reloj se consigue con un proveedor. Nos comunicaremos contigo para confirmar disponibilidad y plazo antes de seguir con tu pedido."
            : "Nos comunicaremos contigo por WhatsApp para coordinar el pago y el envío. No se ha hecho ningún cobro."}
        </p>
      </section>

      <div className="grid gap-px border border-linea bg-linea md:grid-cols-2">
        <section aria-labelledby="resumen-reloj" className="space-y-4 bg-superficie p-6">
          <h2 id="resumen-reloj" className="etiqueta">
            Tu reloj
          </h2>
          <p className="font-display text-headline-sm uppercase">{pedido.nombreReloj}</p>
          <InsigniaModo modo={pedido.modoReloj} />
          <Precio valor={pedido.precioReloj} className="block text-title-lg text-tinta" />
        </section>

        <section aria-labelledby="resumen-entrega" className="space-y-4 bg-superficie p-6">
          <h2 id="resumen-entrega" className="etiqueta">
            Datos de entrega
          </h2>
          <dl className="space-y-3 text-body-md">
            <div>
              <dt className="sr-only">Nombre</dt>
              <dd className="text-tinta">{pedido.nombreComprador}</dd>
            </div>
            <div>
              <dt className="sr-only">Celular</dt>
              <dd className="dato text-tinta-2">+57 {pedido.telefonoComprador}</dd>
            </div>
            <div>
              <dt className="sr-only">Ubicación</dt>
              <dd className="text-tinta-2">
                {pedido.ciudad.nombre}, {pedido.departamento.nombre}
              </dd>
            </div>
            <div>
              <dt className="sr-only">Dirección</dt>
              <dd className="text-tinta-2">{pedido.direccion}</dd>
            </div>
          </dl>
        </section>
      </div>

      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        {contacto.whatsapp.numero && (
          <a
            href={enlaceWhatsApp(
              `Hola, hice el pedido ${pedido.numeroPedido} del reloj ${pedido.nombreReloj}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants()}
          >
            <MessageCircleIcon aria-hidden="true" />
            Escribir por WhatsApp
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        )}
        <Link href="/#catalogo" className={buttonVariants({ variant: "outline" })}>
          Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
