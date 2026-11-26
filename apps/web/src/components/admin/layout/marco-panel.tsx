"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { LinkIcon, LogOutIcon, MenuIcon, PackageIcon, WatchIcon, XIcon } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { cerrarSesion } from "@/lib/api/auth";
import { cn } from "@/lib/utils";

const secciones = [
  { href: "/admin/pedidos", etiqueta: "Pedidos", Icono: PackageIcon },
  { href: "/admin/relojes", etiqueta: "Relojes", Icono: WatchIcon },
  { href: "/admin/enlaces", etiqueta: "Enlaces de contacto", Icono: LinkIcon },
];

function Navegacion({ alNavegar }: { alNavegar?: () => void }) {
  const ruta = usePathname();

  return (
    <nav aria-label="Panel de administración">
      <ul className="space-y-1">
        {secciones.map(({ href, etiqueta, Icono }) => {
          const activa = ruta === href || ruta.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={alNavegar}
                aria-current={activa ? "page" : undefined}
                className={cn(
                  "etiqueta flex min-h-11 items-center gap-3 border-l-2 px-4 transition-colors",
                  activa
                    ? "border-tinta bg-superficie text-tinta"
                    : "border-transparent hover:text-tinta",
                )}
              >
                <Icono className="size-4" aria-hidden="true" />
                {etiqueta}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function CerrarSesion() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="etiqueta flex min-h-11 w-full cursor-pointer items-center gap-3 px-4 text-left transition-colors hover:text-tinta"
      >
        <LogOutIcon className="size-4" aria-hidden="true" />
        Cerrar sesión
      </button>
    </form>
  );
}

/** Estructura del panel: menú lateral en escritorio y barra superior en móvil. */
export function MarcoPanel({ nombre, children }: { nombre: string; children: ReactNode }) {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="hidden border-r border-linea bg-carbon-2 lg:flex lg:flex-col">
        <div className="space-y-2 border-b border-linea px-6 py-6">
          <Link href="/admin/pedidos" aria-label="Omshato, panel de administración">
            <Logo variante="horizontal" />
          </Link>
          <p className="etiqueta">Panel de administración</p>
        </div>
        <div className="flex-1 py-4">
          <Navegacion />
        </div>
        <div className="space-y-1 border-t border-linea py-4">
          <p className="etiqueta truncate px-4 pb-2">{nombre}</p>
          <CerrarSesion />
        </div>
      </aside>

      <div className="min-w-0">
        <header className="relative border-b border-linea bg-carbon-2 lg:hidden">
          <div className="flex h-16 items-center justify-between px-6">
            <Link href="/admin/pedidos" aria-label="Omshato, panel de administración">
              <Logo variante="horizontal" />
            </Link>
            <button
              type="button"
              aria-expanded={menuAbierto}
              aria-controls="menu-panel"
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              onClick={() => setMenuAbierto((valor) => !valor)}
              className="-mr-2 flex size-11 cursor-pointer items-center justify-center"
            >
              {menuAbierto ? <XIcon className="size-5" /> : <MenuIcon className="size-5" />}
            </button>
          </div>
          <div
            id="menu-panel"
            hidden={!menuAbierto}
            className="absolute inset-x-0 top-full z-20 border-b border-linea bg-carbon-2 py-3"
          >
            <Navegacion alNavegar={() => setMenuAbierto(false)} />
            <div className="mt-2 border-t border-linea pt-2">
              <p className="etiqueta truncate px-4 pb-1">{nombre}</p>
              <CerrarSesion />
            </div>
          </div>
        </header>

        <main id="contenido" className="px-6 py-8 md:px-10 md:py-12">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
