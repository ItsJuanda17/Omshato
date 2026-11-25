import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Esquema inicial de Omshato. Parte del modelo físico de referencia
 * (docs/architecture/03_base_de_datos/modelo_fisico_postgresql.sql), PostgreSQL 14 o superior.
 *
 * Diferencia con el modelo de referencia: los 6 estados del pedido no se insertan aquí
 * sino en los seeds (`pnpm seed`), junto con los departamentos y las ciudades.
 */
const CREAR_ESQUEMA = `
-- Catálogos
CREATE TABLE marca (
    id_marca    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE estado_pedido (
    id_estado   SMALLINT PRIMARY KEY,
    nombre      VARCHAR(40) NOT NULL UNIQUE
);

CREATE TABLE departamento (
    id_departamento SMALLINT PRIMARY KEY,
    codigo_dane     CHAR(2) NOT NULL UNIQUE,
    nombre          VARCHAR(60) NOT NULL
);

CREATE TABLE ciudad (
    id_ciudad       INTEGER PRIMARY KEY,
    id_departamento SMALLINT NOT NULL REFERENCES departamento (id_departamento),
    codigo_dane     CHAR(5) NOT NULL UNIQUE,
    nombre          VARCHAR(80) NOT NULL
);

-- Administrador (REQ-AUT-*)
CREATE TABLE administrador (
    id_administrador  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    correo            VARCHAR(254) NOT NULL UNIQUE,
    contrasena_hash   VARCHAR(255) NOT NULL,
    intentos_fallidos SMALLINT NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
    bloqueado_hasta   TIMESTAMPTZ,
    fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catálogo de relojes (REQ-ADM-*, REQ-CAT-*, REQ-DET-*)
CREATE TABLE reloj (
    id_reloj            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_marca            INTEGER NOT NULL REFERENCES marca (id_marca),
    nombre              VARCHAR(150) NOT NULL,
    genero              VARCHAR(20) NOT NULL,
    precio_cop          BIGINT NOT NULL CHECK (precio_cop > 0),
    cantidad            INTEGER CHECK (cantidad IS NULL OR cantidad >= 0),
    garantia            VARCHAR(150) NOT NULL,
    detalle_mecanica    TEXT,
    descripcion         TEXT,
    modo                VARCHAR(12) NOT NULL CHECK (modo IN ('DISPONIBLE', 'BAJO_PEDIDO')),
    visible             BOOLEAN NOT NULL DEFAULT TRUE,
    plazo_estimado      VARCHAR(60),
    url_amigable        VARCHAR(160) NOT NULL UNIQUE,
    fecha_publicacion   TIMESTAMPTZ NOT NULL DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_reloj_catalogo ON reloj (visible, fecha_publicacion DESC);
CREATE INDEX ix_reloj_marca    ON reloj (id_marca);
CREATE INDEX ix_reloj_genero   ON reloj (genero);
CREATE INDEX ix_reloj_precio   ON reloj (precio_cop);

CREATE TABLE imagen_reloj (
    id_imagen    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reloj     INTEGER NOT NULL REFERENCES reloj (id_reloj) ON DELETE CASCADE,
    archivo      VARCHAR(255) NOT NULL,
    orden        SMALLINT NOT NULL CHECK (orden >= 1),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_reloj, orden)
);

-- Una sola foto principal por reloj (REQ-ADM-10).
CREATE UNIQUE INDEX uq_imagen_principal ON imagen_reloj (id_reloj) WHERE es_principal;

-- Auditoría de precios (SEF-5)
CREATE TABLE historial_precio (
    id_cambio        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reloj         INTEGER NOT NULL REFERENCES reloj (id_reloj),
    id_administrador INTEGER NOT NULL REFERENCES administrador (id_administrador),
    precio_anterior  BIGINT NOT NULL CHECK (precio_anterior > 0),
    precio_nuevo     BIGINT NOT NULL CHECK (precio_nuevo > 0),
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_historial_precio_reloj ON historial_precio (id_reloj, fecha_hora DESC);

-- Pedidos sin registro (REQ-PED-*, REQ-GPE-*)
CREATE TABLE pedido (
    id_pedido                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_pedido             VARCHAR(20) NOT NULL UNIQUE,
    -- ON DELETE RESTRICT impide eliminar un reloj con pedidos (RN-8, REQ-ADM-8)
    id_reloj                  INTEGER NOT NULL REFERENCES reloj (id_reloj) ON DELETE RESTRICT,
    id_estado                 SMALLINT NOT NULL REFERENCES estado_pedido (id_estado),
    id_ciudad                 INTEGER NOT NULL REFERENCES ciudad (id_ciudad),
    -- Datos del reloj en el momento de la compra (REQ-PED-10, RN-7, SEF-3)
    nombre_reloj              VARCHAR(150) NOT NULL,
    precio_reloj              BIGINT NOT NULL CHECK (precio_reloj > 0),
    modo_reloj                VARCHAR(12) NOT NULL CHECK (modo_reloj IN ('DISPONIBLE', 'BAJO_PEDIDO')),
    -- Datos del comprador, sin cuenta (REQ-PED-2)
    nombre_comprador          VARCHAR(120) NOT NULL CHECK (btrim(nombre_comprador) <> ''),
    telefono_comprador        VARCHAR(10) NOT NULL CHECK (telefono_comprador ~ '^[0-9]{10}$'),
    direccion                 VARCHAR(250) NOT NULL CHECK (btrim(direccion) <> ''),
    -- Evidencia de la autorización de datos personales, Ley 1581 de 2012 (REQ-PED-6, SEI-5)
    fecha_autorizacion_datos  TIMESTAMPTZ NOT NULL,
    motivo_cancelacion        VARCHAR(250),
    clave_idempotencia        VARCHAR(64) UNIQUE,
    fecha_creacion            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_pedido_estado ON pedido (id_estado, fecha_creacion DESC);
CREATE INDEX ix_pedido_reloj  ON pedido (id_reloj);

-- Historial de estados: una fila por cambio, incluida la inicial (REQ-GPE-7).
-- id_administrador es NULL en la fila inicial, que registra el sistema.
CREATE TABLE historial_estado (
    id_historial     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido        INTEGER NOT NULL REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    id_estado        SMALLINT NOT NULL REFERENCES estado_pedido (id_estado),
    id_administrador INTEGER REFERENCES administrador (id_administrador),
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_historial_estado_pedido ON historial_estado (id_pedido, fecha_hora);

-- Notas internas (REQ-GPE-11)
CREATE TABLE nota_pedido (
    id_nota          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido        INTEGER NOT NULL REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    id_administrador INTEGER NOT NULL REFERENCES administrador (id_administrador),
    texto            VARCHAR(1000) NOT NULL CHECK (btrim(texto) <> ''),
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_nota_pedido ON nota_pedido (id_pedido);

-- Enlaces de contacto editables (REQ-CON-5)
CREATE TABLE enlace_contacto (
    id_enlace INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo      VARCHAR(15) NOT NULL UNIQUE CHECK (tipo IN ('WHATSAPP', 'INSTAGRAM', 'TIKTOK')),
    valor     VARCHAR(255) NOT NULL,
    activo    BOOLEAN NOT NULL DEFAULT TRUE
);
`;

/** Tablas en orden inverso a su creación, para que las claves foráneas no estorben. */
const TABLAS = [
  "enlace_contacto",
  "nota_pedido",
  "historial_estado",
  "pedido",
  "historial_precio",
  "imagen_reloj",
  "reloj",
  "administrador",
  "ciudad",
  "departamento",
  "estado_pedido",
  "marca",
];

export class EsquemaInicial1795557600000 implements MigrationInterface {
  name = "EsquemaInicial1795557600000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(CREAR_ESQUEMA);
  }

  async down(queryRunner: QueryRunner) {
    for (const tabla of TABLAS) {
      await queryRunner.query(`DROP TABLE IF EXISTS ${tabla}`);
    }
  }
}
