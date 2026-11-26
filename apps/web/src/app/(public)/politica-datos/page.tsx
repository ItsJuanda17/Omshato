import type { Metadata } from "next";

import { Documento, SeccionDocumento } from "@/components/layout/documento";
import { enlaceWhatsApp } from "@/lib/contacto/enlaces";
import { contactoPublico } from "@/lib/contacto/servidor";

export const metadata: Metadata = {
  title: "Política de tratamiento de datos personales",
  description:
    "Cómo trata Omshato tus datos personales cuando haces un pedido, conforme a la Ley 1581 de 2012.",
  alternates: { canonical: "/politica-datos" },
};

/*
 * Borrador de redacción. El texto legal definitivo lo valida un asesor jurídico
 * (TBD-12 del SRS), igual que el plazo de conservación de los datos (TBD-17).
 */
export default async function PaginaPoliticaDatos() {
  const { whatsapp } = await contactoPublico();

  return (
    <Documento
      etiqueta="Información legal"
      titulo="Política de tratamiento de datos personales"
      introduccion="Esta política explica qué datos tuyos usamos cuando haces un pedido en Omshato, para qué los usamos y cómo puedes ejercer tus derechos, conforme a la Ley 1581 de 2012."
    >
      <SeccionDocumento titulo="Quién es el responsable">
        <p>
          El responsable del tratamiento es Omshato, tienda de relojes con operación en Colombia.
          {whatsapp && (
            <>
              {" "}
              Puedes escribirnos por{" "}
              <a
                href={enlaceWhatsApp(whatsapp) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>{" "}
              al <span className="dato">{whatsapp.visible}</span>.
            </>
          )}
        </p>
      </SeccionDocumento>

      <SeccionDocumento titulo="Qué datos recogemos">
        <p>Solo los que necesitas para hacer un pedido, sin crear una cuenta:</p>
        <ul>
          <li>Nombre y apellidos.</li>
          <li>Número de celular o WhatsApp.</li>
          <li>Departamento, ciudad y dirección de entrega.</li>
        </ul>
        <p>No recogemos datos de tarjetas ni de cuentas bancarias: el sitio no cobra en línea.</p>
      </SeccionDocumento>

      <SeccionDocumento titulo="Para qué los usamos">
        <ul>
          <li>Registrar y gestionar tu pedido.</li>
          <li>Contactarte para confirmar disponibilidad, plazo, pago y envío.</li>
          <li>Coordinar la entrega del reloj.</li>
          <li>Atender consultas, garantías y reclamos sobre tu compra.</li>
        </ul>
      </SeccionDocumento>

      <SeccionDocumento titulo="Tu autorización">
        <p>
          Al marcar la casilla del formulario de pedido nos das tu autorización previa, expresa e
          informada para tratar tus datos con estas finalidades. Guardamos la fecha y la hora en que
          la diste.
        </p>
      </SeccionDocumento>

      <SeccionDocumento titulo="Tus derechos">
        <ul>
          <li>Conocer, actualizar y rectificar tus datos.</li>
          <li>Pedir prueba de la autorización que nos diste.</li>
          <li>Saber cómo usamos tus datos.</li>
          <li>Revocar la autorización y pedir que suprimamos tus datos cuando proceda.</li>
          <li>Presentar quejas ante la Superintendencia de Industria y Comercio.</li>
        </ul>
        <p>
          Para ejercerlos escríbenos por el canal de contacto. Respondemos las consultas en máximo
          10 días hábiles y los reclamos en máximo 15 días hábiles.
        </p>
      </SeccionDocumento>

      <SeccionDocumento titulo="Quién ve tus datos">
        <p>
          Solo las personas autorizadas de Omshato. No vendemos tus datos. Solo los compartimos
          cuando es necesario para entregarte el pedido o cuando una autoridad lo exige.
        </p>
      </SeccionDocumento>

      <SeccionDocumento titulo="Cuánto tiempo los conservamos">
        <p>
          Conservamos tus datos mientras sean necesarios para las finalidades de esta política y
          para cumplir obligaciones legales. Después los suprimimos o los dejamos anónimos.
        </p>
      </SeccionDocumento>

      <SeccionDocumento titulo="Cookies">
        <p>
          El sitio solo usa las cookies necesarias para la sesión de quien administra la tienda. No
          usamos cookies de publicidad ni de analítica.
        </p>
      </SeccionDocumento>
    </Documento>
  );
}
