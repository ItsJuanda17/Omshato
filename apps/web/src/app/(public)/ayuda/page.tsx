import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Documento } from "@/components/layout/documento";
import { buttonVariants } from "@/components/ui/button";
import { contacto } from "@/config/contacto";
import { enlaceWhatsApp } from "@/lib/contacto";

export const metadata: Metadata = {
  title: "Ayuda",
  description:
    "Cómo hacer un pedido en Omshato, qué significa Bajo pedido, cómo se paga y cómo funcionan los envíos y la garantía.",
  alternates: { canonical: "/ayuda" },
};

const preguntas: { pregunta: string; respuesta: ReactNode }[] = [
  {
    pregunta: "¿Cómo hago un pedido?",
    respuesta: (
      <p>
        Entra a la ficha del reloj que te gusta y pulsa «Pedir este reloj». Llena tu nombre,
        celular y dirección de entrega, acepta la política de datos y envía. No necesitas crear una
        cuenta. Al terminar verás tu número de pedido.
      </p>
    ),
  },
  {
    pregunta: "¿Qué significan Disponible y Bajo pedido?",
    respuesta: (
      <>
        <p>
          <strong className="text-tinta">Disponible</strong> quiere decir que el reloj está en
          nuestras manos y se puede entregar sin esperar a un proveedor.
        </p>
        <p>
          <strong className="text-tinta">Bajo pedido</strong> quiere decir que lo conseguimos con un
          proveedor después de tu pedido. Te escribimos para confirmar disponibilidad, precio y
          plazo antes de seguir. Si no se puede conseguir o no te sirven las condiciones, el pedido
          se cancela.
        </p>
      </>
    ),
  },
  {
    pregunta: "¿Cómo pago?",
    respuesta: (
      <p>
        El sitio no cobra en línea ni guarda datos de tarjetas. Después de tu pedido nos
        comunicamos contigo por WhatsApp para coordinar el pago.
      </p>
    ),
  },
  {
    pregunta: "¿Cuánto tarda un reloj bajo pedido?",
    respuesta: (
      <p>
        Depende del reloj. Cuando tenemos un estimado, aparece en su ficha como «Plazo estimado».
        El plazo definitivo te lo confirmamos al contactarte.
      </p>
    ),
  },
  {
    pregunta: "¿Hacen envíos a todo el país?",
    respuesta: (
      <p>
        Entregamos en Colombia. Al contactarte te confirmamos el costo y el tiempo de envío a tu
        ciudad.
      </p>
    ),
  },
  {
    pregunta: "¿Tienen garantía?",
    respuesta: (
      <p>
        Sí. La garantía depende de cada reloj y aparece en su ficha. Conserva tu número de pedido
        para cualquier reclamo.
      </p>
    ),
  },
  {
    pregunta: "¿Qué hacen con mis datos?",
    respuesta: (
      <p>
        Solo los usamos para gestionar tu pedido y contactarte. Lee la{" "}
        <Link href="/politica-datos" className="text-tinta underline underline-offset-4">
          política de tratamiento de datos personales
        </Link>
        .
      </p>
    ),
  },
];

export default function PaginaAyuda() {
  return (
    <Documento
      etiqueta="Ayuda"
      titulo="Preguntas frecuentes"
      introduccion="Lo que suelen preguntarnos antes de hacer un pedido."
    >
      <div className="divide-y divide-linea">
        {preguntas.map((item) => (
          <details key={item.pregunta} className="group py-1">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-3 font-display text-headline-sm uppercase [&::-webkit-details-marker]:hidden">
              {item.pregunta}
              <ChevronDownIcon
                className="size-5 shrink-0 text-tinta-2 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>
            <div className="space-y-3 pb-6 text-body-md text-tinta-2">{item.respuesta}</div>
          </details>
        ))}
      </div>

      {contacto.whatsapp.numero && (
        <section className="space-y-4 py-8">
          <h2 className="font-display text-headline-sm uppercase">¿Sigues con dudas?</h2>
          <p className="text-body-md text-tinta-2">Escríbenos y te respondemos.</p>
          <a
            href={enlaceWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            Escribir por WhatsApp
            <span className="sr-only">(se abre en una pestaña nueva)</span>
          </a>
        </section>
      )}
    </Documento>
  );
}
