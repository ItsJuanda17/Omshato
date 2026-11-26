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
│   ├── estrategia-nombres.ts  propiedadCamelCase → columna_snake_case
│   ├── migrations/          Migraciones escritas a mano a partir del modelo físico de docs/
│   └── seeds/               Datos base: 6 estados del pedido, 33 departamentos y 1.122 municipios (DIVIPOLA)
├── common/
│   ├── database/            Transformadores de columnas
│   ├── filters/             Respuesta de error uniforme
│   ├── decorators/  guards/  pipes/  interceptors/
└── modules/
    ├── auth/  catalogo/  pedidos/  ubicaciones/  contacto/  notificaciones/  almacenamiento/
    │   └── <módulo>/entities/   Entidades de TypeORM (auth, catalogo, pedidos, ubicaciones y contacto)
test/
├── *.e2e-spec.ts            Pruebas e2e del API (sin base de datos)
├── integracion/             Pruebas de integración contra PostgreSQL real
└── ayudantes/               Utilidades de prueba
```

## Puesta en marcha

Desde la raíz del repositorio:

```bash
pnpm db:up                                      # PostgreSQL en Docker (requiere Docker Desktop encendido)
cp apps/api/.env.example apps/api/.env          # y ajusta lo que haga falta
pnpm db:migrate                                 # crea las tablas
pnpm db:seed                                    # carga estados, departamentos y ciudades
ADMIN_CORREO=tu@correo.com ADMIN_CONTRASENA=una-clave-larga pnpm admin:crear   # primer administrador
pnpm dev:api                                    # http://localhost:3001/api/salud
```

## Comandos (en `apps/api` o con `pnpm --filter @omshato/api <comando>`)

| Comando                  | Qué hace                                            |
| ------------------------ | --------------------------------------------------- |
| `pnpm dev`               | API con recarga                                     |
| `pnpm build`             | Compila a `dist/`                                   |
| `pnpm test`              | Pruebas unitarias                                   |
| `pnpm test:e2e`          | Pruebas e2e de la app completa, sin base de datos   |
| `pnpm test:integracion`  | Esquema, seeds y autenticación contra PostgreSQL    |
| `pnpm seed`              | Carga los datos base. Se puede repetir sin problema |
| `pnpm admin:crear`       | Crea el administrador, o le restablece la clave     |
| `pnpm lint`, `typecheck` | oxlint con tipos y TypeScript                       |
| `pnpm migration:run`     | Aplica las migraciones pendientes                   |
| `pnpm migration:revert`  | Deshace la última migración                         |

## Rutas

Todas cuelgan de `/api`. Las públicas llevan `@Public()`; las de `/admin` exigen sesión.

| Ruta                                                                           | Qué devuelve                                                       |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `GET /salud`                                                                   | Está vivo                                                          |
| `GET /ubicaciones/departamentos`, `/ubicaciones/ciudades?idDepartamento=`      | Listas del formulario de pedido                                    |
| `GET /relojes`, `/relojes/:urlAmigable`, `/marcas`                             | Catálogo público: solo relojes visibles                            |
| `GET /contacto`                                                                | Íconos de contacto activos                                         |
| `POST /auth/login`, `/auth/logout`, `/auth/cambiar-contrasena`; `GET /auth/yo` | Sesión del administrador                                           |
| `GET/POST /admin/relojes`, `GET/PUT/DELETE /admin/relojes/:id`                 | Gestión del catálogo (409 `TIENE_PEDIDOS` al eliminar con pedidos) |
| `PATCH /admin/relojes/:id/modo`, `/admin/relojes/:id/visibilidad`              | Cambios rápidos sin abrir el formulario                            |
| `GET /admin/marcas`                                                            | Todas las marcas, también las que solo tienen relojes ocultos      |
| `GET/PUT /admin/contacto`                                                      | Los tres enlaces de contacto                                       |
| `POST /pedidos`                                                                | Pedido sin registro: 201 nuevo, 200 si es el mismo envío repetido  |
| `GET /admin/pedidos`, `GET /admin/pedidos/:id`                                 | Lista y detalle, con historial y notas internas                    |
| `POST /admin/pedidos/:id/estado`, `POST /admin/pedidos/:id/notas`              | Cambiar de estado (Tabla 2 del SRS) y agregar notas                |
| `POST /admin/fotos` (campo `foto`), `GET /fotos/relojes/:archivo`              | Subir una foto (máx. 5 MB, solo imágenes) y verla                  |

## Convenciones

- **Errores:** todos salen como `{ estado, codigo, mensaje, detalles?, ruta, fecha }`. El front se apoya en `codigo`. Para un código propio, `new ConflictException(mensaje, { errorCode: 'TRANSICION_NO_PERMITIDA' })`.
- **Validación:** `@Body({ schema })` con un esquema de Zod. No hay pipe propio.
- **Esquema de la base de datos:** solo con migraciones, escritas a mano en SQL. `synchronize` está apagado y no se usa `migration:generate`.
- **Pruebas de integración:** corren en la base `omshato_test` (la crea `docker-compose` la primera vez) y la reinician en cada corrida. Se niegan a correr en una base cuyo nombre no termine en `_test`.
- **Entidades:** viven en `modules/<módulo>/entities/*.entity.ts`. Cada columna declara su tipo, las relaciones usan `Relation<T>` (evita errores de importación circular en ESM) y los `bigint` de precio pasan por `transformadorBigint`.
- **Autenticación:** `@nestjs/authentication` con sesión en el servidor (tabla `sesion`) y cookie `__Host-sid` HttpOnly. Su guard es global: toda ruta exige sesión salvo las marcadas con `@Public()`. `@CurrentUser()` entrega el `AdministradorActual`. Bloqueo tras `AUTH_MAX_INTENTOS` fallos por `AUTH_BLOQUEO_MINUTOS`; inactividad y duración en `SESION_*` (valores de referencia, TBD-17). No hay registro ni recuperación por correo: el administrador se crea y se restablece con `pnpm admin:crear`, que lee la clave del entorno y no de argumentos.
- **Pruebas e2e:** usan `BaseDeDatosFalsaModule`: los repositorios existen pero cualquier consulta falla. Lo que toque la base va en `test/integracion`.
- **Orden alfabético:** se hace en el servicio con `compararNombres` (colación española) y no con `ORDER BY`: la base manda las tildes al final y "Córdoba" saldría después de "Cundinamarca".
- **Fotos:** se suben con `POST /admin/fotos`, que devuelve una clave (`relojes/<uuid>.png`) que luego se envía al crear o editar el reloj. El tipo se decide por el contenido del archivo y el nombre que manda el navegador se ignora. Se guardan en `ALMACENAMIENTO_RUTA` (disco local, sin costo de nube); para pasar a un servicio en la nube se cambia `LocalDisk` por `S3Disk` en `almacenamiento.module.ts`. Al quitar una foto de un reloj o eliminarlo, su archivo se borra si nadie más lo usa.
- **Pedidos:** nacen en Recibido (reloj Disponible) o Por conseguir con proveedor (Bajo pedido). El comprador nunca recibe las notas internas. La idempotencia se apoya en `clave_idempotencia UNIQUE`: el mismo envío devuelve el pedido ya registrado. El número `OMS-0001` sale de una secuencia de Postgres.
- **Límite de solicitudes (SEI-8):** `@LimitarSolicitudes(límite, minutos)` en el inicio de sesión (10 por 15 min) y en `POST /pedidos` (10 por 10 min), por IP. No va en todo el API porque el front lo consulta desde su servidor y muchos visitantes compartirían una IP. Detrás de un proxy hay que poner `PROXIES_DE_CONFIANZA`, y el front debe reenviar la IP real del visitante en `X-Forwarded-For`; si no, todos cuentan como uno solo.
- **Notificaciones:** el módulo está vacío a propósito. El canal de aviso al administrador (TBD-9) no está decidido; cuando se decida, el punto de enganche es `PedidosService.crear`, después de la transacción.
- **Datos personales:** nada de nombre, teléfono o dirección en URLs ni en registros (SEI-4).
