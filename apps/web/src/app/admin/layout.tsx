import type { Metadata } from "next";

// SEI-9: las páginas del panel no deben ser indexables por buscadores.
export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Omshato" },
  robots: { index: false, follow: false },
};

export default function LayoutAdmin({ children }: { children: React.ReactNode }) {
  return children;
}
