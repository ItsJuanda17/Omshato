# Omshato

Tienda web de relojes con un solo vendedor (Colombia). Monorepo con pnpm workspaces.

```
omshato/
├── apps/
│   ├── web/                  Frontend en Next.js. Habla con el API desde su servidor
│   └── api/                  Backend en NestJS + TypeORM + PostgreSQL (ver apps/api/README.md)
├── packages/
│   └── contratos/            Lo que comparten front y API: tipos, esquemas Zod y reglas del negocio
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
│   ├── api/                  Servicios que llaman al API (cliente.ts es el cliente HTTP) y los tipos
│   ├── auth/                 Sesión del administrador: guarda el token que entrega el API
│   ├── validaciones/         Esquemas de los formularios (las reglas de fondo son de contratos)
│   ├── catalogo/  contacto/  pedidos/  relojes/   Reglas y utilidades por dominio
│   ├── svg/                  Geometría de los engranajes
│   └── formato.ts  utils.ts  Utilidades comunes
```

**Convenciones:** los componentes se agrupan por dominio y no por tipo; la lógica sin interfaz va en `lib/<dominio>`; nada fuera de `lib/api` y `lib/auth` sabe de dónde vienen los datos, y las reglas que el API también aplica (validaciones, estados del pedido, contacto) viven en `packages/contratos`, no aquí.

## Puesta en marcha

Requieren Node 20 o superior, pnpm 10 y Docker Desktop. Todo se ejecuta desde la raíz.

```bash
pnpm install                  # también compila packages/contratos
pnpm db:up                    # PostgreSQL en Docker
cp apps/api/.env.example apps/api/.env
pnpm db:migrate               # crea las tablas
pnpm db:seed                  # estados del pedido, departamentos, ciudades y enlaces de contacto

# El primer administrador (no hay registro público). La clave va por entorno, no por argumentos.
ADMIN_CORREO=tu@correo.com ADMIN_CONTRASENA=una-clave-larga pnpm admin:crear

pnpm demo:cargar              # opcional: 8 relojes de ejemplo con fotos y los enlaces de contacto

pnpm dev:api                  # API en http://localhost:3001/api/salud
pnpm dev                      # sitio en http://localhost:3000 y panel en /admin
```

El front solo necesita `API_URL` si el API no está en `http://localhost:3001` (ver `apps/web/.env.example`).

## Comandos

```bash
pnpm test              # pruebas unitarias de todos los paquetes
pnpm test:e2e          # e2e del API, sin base de datos
pnpm test:integracion  # API contra PostgreSQL real (base omshato_test)
pnpm build             # compilación de producción del front
pnpm build:api         # compilación del API
pnpm lint              # ESLint y oxlint
pnpm typecheck         # TypeScript estricto
pnpm format            # Prettier
pnpm check             # lint, typecheck y formato
pnpm db:down           # apaga la base de datos
```

`@omshato/contratos` se compila a `dist` y el front y el API lo importan de ahí. Los scripts que lo necesitan (`dev`, `build`, `test`, `typecheck`, `lint`…) lo recompilan antes, así que no hay que hacerlo a mano.

## Cómo se conectan el front y el API

El navegador nunca habla con el API: habla con Next, y el servidor de Next habla con el API (`apps/web/src/lib/api/cliente.ts`).

- **Sesión del administrador:** el API la guarda en su tabla `sesion` y entrega un token. Next lo deja en una cookie `HttpOnly` del sitio (`omshato_sesion`) y lo reenvía en cada llamada. Un 401 del API lleva al inicio de sesión.
- **Fotos:** el API guarda la clave (`relojes/<id>.png`) y Next las sirve bajo `/fotos/…` con un `rewrite` al API. Así no hay CORS y el optimizador de imágenes las ve como locales.
- **Errores:** los rechazos de negocio (reloj con pedidos, transición no permitida, datos inválidos) llegan al formulario como dato y conservan lo escrito. Una caída del API muestra `app/error.tsx`.
- **Contratos compartidos:** los tipos, los esquemas Zod y las reglas que ambos aplican (estados del pedido, resolución del contacto) viven en `packages/contratos`. Hay una sola copia.

### Para producción

- **IP del visitante:** el límite de solicitudes (login y pedido) cuenta por IP. Next reenvía la IP en `X-Forwarded-For` y el API debe tener `PROXIES_DE_CONFIANZA=1` (el número de proxies delante de él). Si el sitio está detrás de otro proxy (Nginx, Cloudflare), ese proxy debe ser quien agrega la IP real al encabezado y el API debe ser alcanzable solo desde Next.
- **Cookie de sesión:** en producción la cookie del sitio es `Secure`, así que el sitio debe servirse por HTTPS.
- **Fotos:** hoy van a una carpeta del servidor del API (`ALMACENAMIENTO_RUTA`). Esa carpeta debe respaldarse o vivir en un volumen persistente.
- **Notificaciones:** el aviso de pedido nuevo al administrador sigue pendiente (TBD-9). Hoy el administrador ve los pedidos al abrir el panel.
