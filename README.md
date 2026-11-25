# Omshato

Tienda web de relojes con un solo vendedor (Colombia). Monorepo con pnpm workspaces.

```
omshato/
├── apps/
│   ├── web/                  Frontend en Next.js. Hoy usa datos simulados en memoria
│   └── api/                  Backend en NestJS + TypeORM + PostgreSQL (ver apps/api/README.md)
├── docs/
│   ├── srs/                  Especificación de requisitos
│   ├── architecture/         Diagramas: casos de uso, C4, base de datos, secuencia y estados
│   └── diseno/               Referencias visuales (Stitch y prototipo HTML), solo lectura
├── docker-compose.yml        PostgreSQL para desarrollo
├── package.json              Scripts del monorepo
└── pnpm-workspace.yaml
```

`docs/` no se modifica desde el código.

### Estructura de `apps/web/src`

```
src/
├── app/                      Rutas (App Router)
│   ├── (public)/             Sitio público: inicio, ficha, pedido, confirmación, ayuda, política
│   └── admin/                Panel: login y (panel)/ con pedidos, relojes y enlaces
├── components/
│   ├── ui/                   Primitivas de interfaz (botón, campo, chip…)
│   ├── brand/                Logo, engranajes y motivos mecánicos
│   ├── feedback/             Estados de carga y vacíos
│   ├── layout/               Cabecera, pie y páginas de texto del sitio público
│   ├── catalogo/             Portada y catálogo con filtros
│   ├── relojes/              Tarjeta, galería, especificaciones, precio
│   ├── pedidos/              Formulario, resumen y confirmación del pedido
│   └── admin/                Panel, una carpeta por sección:
│       ├── layout/  comun/  sesion/  pedidos/  relojes/  enlaces/
├── lib/
│   ├── api/                  Servicios y tipos de dominio. Es lo que se reemplaza por la API real
│   │   └── mock/             Almacén y datos de ejemplo en memoria. Se borra al conectar el backend
│   ├── auth/                 Sesión del administrador (punto de integración)
│   ├── validaciones/         Esquemas Zod compartidos entre formularios y servicios
│   ├── catalogo/  contacto/  pedidos/  relojes/   Reglas y utilidades por dominio
│   ├── svg/                  Geometría de los engranajes
│   └── formato.ts  utils.ts  Utilidades comunes
└── config/                   Valores iniciales de contacto
```

**Convenciones:** los componentes se agrupan por dominio y no por tipo; la lógica sin interfaz va en `lib/<dominio>`; nada fuera de `lib/api` y `lib/auth` sabe de dónde vienen los datos.

## Comandos

Requieren Node 20 o superior y pnpm 10. Se ejecutan desde la raíz.

```bash
pnpm install
pnpm dev          # front en http://localhost:3000
pnpm dev:api      # API en http://localhost:3001/api/salud (antes: pnpm db:up)
pnpm db:up        # PostgreSQL en Docker
pnpm db:down      # apaga la base de datos
pnpm test         # pruebas de todos los paquetes
pnpm build        # compilación de producción
pnpm lint         # ESLint
pnpm typecheck    # TypeScript estricto
pnpm format       # Prettier
pnpm check        # lint, typecheck y formato
```

Variables de entorno: copia `apps/web/.env.example` a `apps/web/.env.local`.

## Panel del administrador (simulado)

El panel vive en `/admin`. Mientras no exista el backend, la sesión es simulada y los datos están en memoria del servidor, así que se reinician al reiniciarlo.

- Correo: `admin@omshato.com`
- Contraseña: `omshato-demo`

Se pueden cambiar con `ADMIN_DEMO_CORREO` y `ADMIN_DEMO_CONTRASENA` en `apps/web/.env.local`.

## Dónde conectar el backend

- **Servicios:** todo `apps/web/src/lib/api` devuelve datos de ejemplo. Al conectar la API real se cambia el cuerpo de cada función por una llamada HTTP y se quita `"use server"`. Las firmas y los tipos no cambian.
- **Sesión:** `apps/web/src/lib/auth/sesion.ts` es el único punto que sabe cómo se valida la sesión.
- **Contacto:** los valores iniciales de WhatsApp, Instagram y TikTok están en `apps/web/src/config/contacto.ts`. Desde el panel se editan en «Enlaces de contacto».
