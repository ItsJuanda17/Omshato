import { Engranaje, RuedaEscape, Tornillo } from "@/components/brand/engranajes";
import { Logo } from "@/components/brand/logo";
import { SeparadorBisel } from "@/components/brand/separador-bisel";
import { Cargando, EstadoVacio } from "@/components/feedback/estados";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/**
 * Página provisional de la Fase 1: muestra los tokens y los componentes base.
 * La Fase 2 la reemplaza por el inicio real (hero y catálogo).
 */
export default function PaginaInicio() {
  return (
    <div className="contenedor space-y-16 py-16">
      <section className="relative overflow-hidden border border-linea px-6 py-20 text-center">
        <Engranaje dientes={24} giro="horaria" duracion={90} className="absolute -right-24 -bottom-24 w-80 opacity-15" />
        <Engranaje dientes={16} giro="antihoraria" duracion={60} className="absolute -top-16 -left-16 w-52 opacity-10" />
        <div className="relative flex flex-col items-center gap-6">
          <Logo variante="vertical" eslogan />
          <h1 className="font-display text-display-md-mobile uppercase md:text-display-lg">
            Omshato
          </h1>
          <p className="max-w-xl text-body-lg text-tinta-2">
            Andamiaje de la Fase 1: tokens de diseño, componentes base, logo y motivo mecánico.
          </p>
        </div>
      </section>

      <SeparadorBisel />

      <section className="grid gap-10 md:grid-cols-2">
        <div className="space-y-6">
          <p className="etiqueta">Botones y etiquetas</p>
          <div className="flex flex-wrap gap-3">
            <Button>Pedir este reloj</Button>
            <Button variant="outline">Consultar por WhatsApp</Button>
            <Button variant="ghost" size="sm">Editar</Button>
            <Button variant="link">Ver especificaciones</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Disponible</Badge>
            <Badge variant="solido">Bajo pedido</Badge>
            <Badge variant="activo">Recibido</Badge>
          </div>
          <p className="dato text-body-md text-tinta-2">OMS-000123 · 40,0 mm · 80 h</p>
        </div>

        <form className="space-y-5" noValidate>
          <p className="etiqueta">Campos de formulario</p>
          <div className="space-y-2">
            <Label htmlFor="demo-nombre">Nombre y apellidos</Label>
            <Input id="demo-nombre" placeholder="Nombre completo" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-error">Teléfono</Label>
            <Input id="demo-error" defaultValue="30012" aria-invalid aria-describedby="demo-error-msg" />
            <p id="demo-error-msg" className="text-body-sm text-tinta">
              Escribe un celular de 10 dígitos.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="demo-notas">Instrucciones de entrega</Label>
            <Textarea id="demo-notas" placeholder="Opcional" />
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="demo-politica" />
            <Label htmlFor="demo-politica" className="text-body-sm tracking-normal normal-case">
              Acepto la política de tratamiento de datos personales
            </Label>
          </div>
        </form>
      </section>

      <SeparadorBisel />

      <section className="grid items-center gap-8 border border-linea p-8 sm:grid-cols-3">
        <div className="flex items-center justify-center gap-6">
          <RuedaEscape giro="horaria" duracion={40} className="w-24 opacity-60" />
          <Tornillo className="w-8 opacity-60" />
        </div>
        <Cargando mensaje="Cargando relojes" />
        <EstadoVacio
          titulo="No encontramos relojes con esos filtros"
          descripcion="Prueba con otra marca o un rango de precio más amplio."
          accion={<Button variant="outline" size="sm">Limpiar filtros</Button>}
        />
      </section>
    </div>
  );
}
