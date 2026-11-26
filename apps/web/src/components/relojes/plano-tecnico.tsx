import { cn } from "@/lib/utils";

const TRAZO = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1,
  vectorEffect: "non-scaling-stroke",
} as const;

/**
 * Vista superior de la caja al estilo de un plano técnico, con la cota del
 * diámetro cuando se conoce. Es decorativa: el dato real está en la lista.
 */
export function PlanoTecnico({ diametro, className }: { diametro?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 250"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none text-tinta-3", className)}
    >
      <g {...TRAZO}>
        <circle cx="120" cy="108" r="78" />
        <circle cx="120" cy="108" r="68" opacity="0.6" />
        <circle cx="120" cy="108" r="4" />
        <rect x="198" y="100" width="12" height="16" />
        <path d="M96 30 L100 18 H140 L144 30 M96 186 L100 198 H140 L144 186" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i * Math.PI) / 6;
          const x1 = 120 + 56 * Math.sin(a);
          const y1 = 108 - 56 * Math.cos(a);
          const x2 = 120 + 64 * Math.sin(a);
          const y2 = 108 - 64 * Math.cos(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        <g strokeDasharray="6 4" opacity="0.7">
          <line x1="120" y1="8" x2="120" y2="208" />
          <line x1="20" y1="108" x2="220" y2="108" />
        </g>
        {diametro && (
          <>
            <g strokeDasharray="3 3" opacity="0.7">
              <line x1="42" y1="108" x2="42" y2="232" />
              <line x1="198" y1="108" x2="198" y2="232" />
            </g>
            <line x1="42" y1="226" x2="198" y2="226" />
            <path d="M42 226 l8 -3 v6 z M198 226 l-8 -3 v6 z" fill="currentColor" />
          </>
        )}
      </g>
      {diametro && (
        <text
          x="120"
          y="220"
          textAnchor="middle"
          fill="currentColor"
          fontSize="11"
          fontFamily="var(--font-mono)"
        >
          Ø {diametro}
        </text>
      )}
    </svg>
  );
}
