import type { CSSProperties } from "react";

import { brazos, radiosEngranaje, trazoEngranaje, trazoRuedaEscape } from "@/lib/svg/engranaje";
import { cn } from "@/lib/utils";

/**
 * Motivo mecánico de Omshato: SVG de línea fina para usar a baja opacidad
 * detrás del contenido. Todos son decorativos y no entran en el árbol de accesibilidad.
 */

const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
  strokeLinejoin: "round",
} as const;

type Giro = "horaria" | "antihoraria" | "ninguno";

function claseGiro(giro: Giro) {
  if (giro === "horaria") return "animate-girar";
  if (giro === "antihoraria") return "animate-girar-inverso";
  return undefined;
}

interface CuerpoProps {
  dientes: number;
  modulo: number;
  centro?: readonly [number, number];
  /** Rotación estática en grados, para que dos engranajes encajen. */
  desfase?: number;
  giro?: Giro;
  /** Segundos por vuelta. */
  duracion?: number;
}

/** Engranaje de brazos dentro de un grupo SVG. Lo reutilizan `Engranaje` y `ParEngranajes`. */
function CuerpoEngranaje({
  dientes,
  modulo,
  centro = [0, 0],
  desfase = 0,
  giro = "ninguno",
  duracion = 24,
}: CuerpoProps) {
  const radios = radiosEngranaje(dientes, modulo);
  const aro = radios.raiz * 0.72;
  const cubo = radios.raiz * 0.16;
  const [cx, cy] = centro;
  const estilo: CSSProperties = {
    transformOrigin: `${cx}px ${cy}px`,
    animationDuration: `${duracion}s`,
  };

  return (
    <g className={claseGiro(giro)} style={estilo}>
      <g transform={`translate(${cx} ${cy}) rotate(${desfase})`} {...TRAZO}>
        <path d={trazoEngranaje(dientes, radios)} />
        <circle r={aro} />
        <circle r={cubo} />
        {brazos(5, cubo, aro, Math.PI / 10).map((brazo, i) => (
          <line
            key={i}
            x1={brazo.desde[0]}
            y1={brazo.desde[1]}
            x2={brazo.hasta[0]}
            y2={brazo.hasta[1]}
          />
        ))}
      </g>
    </g>
  );
}

interface EngranajeProps {
  dientes?: number;
  giro?: Giro;
  /** Segundos por vuelta. */
  duracion?: number;
  className?: string;
}

/** Un engranaje suelto. Usa `className` para tamaño, posición, recorte y opacidad. */
export function Engranaje({ dientes = 16, giro = "ninguno", duracion, className }: EngranajeProps) {
  const modulo = 4;
  const { exterior } = radiosEngranaje(dientes, modulo);
  const lado = (exterior + 2) * 2;

  return (
    <svg
      viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`}
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none text-tinta", className)}
    >
      <CuerpoEngranaje dientes={dientes} modulo={modulo} giro={giro} duracion={duracion} />
    </svg>
  );
}

/** Dos engranajes engranados que giran en sentidos opuestos, para cargas y estados vacíos. */
export function ParEngranajes({
  girando = true,
  className,
}: {
  girando?: boolean;
  className?: string;
}) {
  const modulo = 4;
  const dientesA = 12;
  const dientesB = 10;
  const distancia = radiosEngranaje(dientesA, modulo).paso + radiosEngranaje(dientesB, modulo).paso;
  const margen = 31;
  const ancho = distancia + margen * 2;

  return (
    <svg
      viewBox={`0 0 ${ancho} ${margen * 2}`}
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none text-tinta", className)}
    >
      <CuerpoEngranaje
        dientes={dientesA}
        modulo={modulo}
        centro={[margen, margen]}
        giro={girando ? "horaria" : "ninguno"}
        duracion={10 * (dientesA / dientesB)}
      />
      <CuerpoEngranaje
        dientes={dientesB}
        modulo={modulo}
        centro={[margen + distancia, margen]}
        desfase={180 / dientesB}
        giro={girando ? "antihoraria" : "ninguno"}
        duracion={10}
      />
    </svg>
  );
}

/** Rueda de escape con cinco brazos curvos. */
export function RuedaEscape({
  giro = "ninguno",
  duracion,
  className,
}: {
  giro?: Giro;
  duracion?: number;
  className?: string;
}) {
  const exterior = 46;
  const raiz = 38;
  const lado = (exterior + 2) * 2;
  const estilo: CSSProperties = {
    transformOrigin: "0px 0px",
    animationDuration: duracion ? `${duracion}s` : undefined,
  };

  return (
    <svg
      viewBox={`${-lado / 2} ${-lado / 2} ${lado} ${lado}`}
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none text-tinta", className)}
    >
      <g className={claseGiro(giro)} style={estilo} {...TRAZO}>
        <path d={trazoRuedaEscape(15, exterior, raiz)} />
        <circle r={raiz * 0.78} />
        <circle r={raiz * 0.2} />
        <circle r={raiz * 0.05} />
        {Array.from({ length: 5 }, (_, i) => (
          <path key={i} d="M7.6 0 Q20 -3 29.6 -11" transform={`rotate(${i * 72})`} />
        ))}
      </g>
    </svg>
  );
}

/** Tornillo de cabeza ranurada, con la ranura girada `angulo` grados. */
export function Tornillo({ angulo = 35, className }: { angulo?: number; className?: string }) {
  return (
    <svg
      viewBox="-12 -12 24 24"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none text-tinta", className)}
    >
      <g {...TRAZO}>
        <circle r={10} />
        <circle r={7.6} />
        <line x1={-6.4} y1={0} x2={6.4} y2={0} transform={`rotate(${angulo})`} strokeWidth={1.6} />
      </g>
    </svg>
  );
}
