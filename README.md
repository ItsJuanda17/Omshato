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
