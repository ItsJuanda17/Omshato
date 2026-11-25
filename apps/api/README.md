# Omshato API

Backend en NestJS 12 con TypeORM y PostgreSQL. Es ESM: los imports relativos terminan en `.js`, no existe `__dirname` (se usa `import.meta.dirname`) y las pruebas corren en Vitest.

Documentación de Nest: https://docs.nestjs.com/llms.txt

## Estructura

```
src/
├── main.ts                  Arranque
├── configurar-app.ts        Prefijo /api, helmet, CORS, validación. Lo usan main y las pruebas e2e
├── app.module.ts            Módulo raíz
├── app.controller.ts        GET /api/salud
├── config/                  Variables de entorno validadas con Zod
├── database/
│   ├── database.module.ts   Conexión del API
│   ├── data-source.ts       Conexión de la CLI de migraciones
│   ├── opciones.ts          Opciones compartidas entre las dos
│   ├── migrations/          Migraciones SQL
│   └── seeds/               Datos base: estados del pedido, departamentos y ciudades
├── common/
│   ├── filters/             Respuesta de error uniforme
│   ├── decorators/  guards/  pipes/  interceptors/
└── modules/
    ├── auth/  catalogo/  pedidos/  ubicaciones/  contacto/  notificaciones/  almacenamiento/
test/                        Pruebas e2e
```

## Puesta en marcha

Desde la raíz del repositorio:

```bash
pnpm db:up                                      # PostgreSQL en Docker (requiere Docker Desktop encendido)
cp apps/api/.env.example apps/api/.env          # y ajusta lo que haga falta
pnpm dev:api                                    # http://localhost:3001/api/salud
```

## Comandos (en `apps/api` o con `pnpm --filter @omshato/api <comando>`)

| Comando                  | Qué hace                                           |
| ------------------------ | -------------------------------------------------- |
| `pnpm dev`               | API con recarga                                    |
| `pnpm build`             | Compila a `dist/`                                  |
| `pnpm test`              | Pruebas unitarias                                  |
| `pnpm test:e2e`          | Pruebas e2e (no necesitan base de datos por ahora) |
| `pnpm lint`, `typecheck` | oxlint con tipos y TypeScript                      |
| `pnpm migration:run`     | Aplica las migraciones pendientes                  |
| `pnpm migration:revert`  | Deshace la última migración                        |

## Convenciones

- **Errores:** todos salen como `{ estado, codigo, mensaje, detalles?, ruta, fecha }`. El front se apoya en `codigo`. Para un código propio, `new ConflictException(mensaje, { errorCode: 'TRANSICION_NO_PERMITIDA' })`.
- **Validación:** `@Body({ schema })` con un esquema de Zod. No hay pipe propio.
- **Esquema de la base de datos:** solo con migraciones. `synchronize` está apagado.
- **Entidades:** viven en `modules/<módulo>/entities/*.entity.ts` y cada columna declara su tipo, porque la CLI corre con tsx, que no emite metadatos de decoradores.
- **Datos personales:** nada de nombre, teléfono o dirección en URLs ni en registros (SEI-4).
