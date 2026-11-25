import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/** Escala tipográfica propia (ver globals.css). Sin esto, tailwind-merge la confunde con colores. */
const tamanosPropios = [
  "display-lg",
  "display-lg-mobile",
  "display-md",
  "display-md-mobile",
  "headline-lg",
  "headline-md",
  "headline-sm",
  "title-lg",
  "body-lg",
  "body-md",
  "body-sm",
  "label-lg",
  "label-md",
  "label-sm",
];

const combinar = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: tamanosPropios }],
    },
  },
});

export function cn(...entradas: ClassValue[]) {
  return combinar(clsx(entradas));
}
