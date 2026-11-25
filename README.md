# Omshato

Tienda web de relojes con un solo vendedor (Colombia). Monorepo con pnpm workspaces.

| Carpeta    | Contenido                                                         |
| ---------- | ----------------------------------------------------------------- |
| `apps/web` | Frontend en Next.js. Hoy usa datos simulados en memoria.          |
| `docs`     | SRS y diagramas de arquitectura. No se modifican desde el código. |
| `web`      | Mockups de Stitch, solo como referencia visual.                   |

`apps/api` (NestJS y PostgreSQL) se sumará más adelante.

## Comandos

Requieren Node 20 o superior y pnpm 10. Se ejecutan desde la raíz.

```bash
pnpm install
pnpm dev          # servidor de desarrollo en http://localhost:3000
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
