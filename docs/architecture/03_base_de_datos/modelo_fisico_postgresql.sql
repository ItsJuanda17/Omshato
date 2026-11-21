-- =====================================================================
-- Omshato · Modelo físico de referencia
-- Motor de referencia: PostgreSQL 14 o superior.
-- Deriva del SRS v1.0 y del MR de esta carpeta. La base de datos real está
-- por definir (TBD-11), así que este script se adapta si el cliente elige
-- otro motor. Los valores marcados con TBD dependen de preguntas abiertas.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Catálogos
-- ---------------------------------------------------------------------
CREATE TABLE marca (
    id_marca    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre      VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE estado_pedido (
    id_estado   SMALLINT PRIMARY KEY,
    nombre      VARCHAR(40) NOT NULL UNIQUE
);

-- Estados de la Tabla 2 del SRS (REQ-GPE-4). Las transiciones permitidas
-- se validan en la aplicación (REQ-GPE-5), no en la base de datos.
INSERT INTO estado_pedido (id_estado, nombre) VALUES
    (1, 'Recibido'),
    (2, 'Por conseguir con proveedor'),
    (3, 'Confirmado'),
    (4, 'Enviado'),
    (5, 'Entregado'),
    (6, 'Cancelado');

-- Lista de Colombia para el formulario de pedido (REQ-PED-5).
-- Se carga con el listado oficial (DIVIPOLA del DANE).
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

-- ---------------------------------------------------------------------
-- Administrador (REQ-AUT-*)
-- ---------------------------------------------------------------------
CREATE TABLE administrador (
    id_administrador  INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre            VARCHAR(100) NOT NULL,
    correo            VARCHAR(254) NOT NULL UNIQUE,
    contrasena_hash   VARCHAR(255) NOT NULL,          -- bcrypt, scrypt o Argon2 (SEI-2)
    intentos_fallidos SMALLINT NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
    bloqueado_hasta   TIMESTAMPTZ,                    -- bloqueo temporal (REQ-AUT-4, TBD-17)
    fecha_creacion    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Catálogo de relojes (REQ-ADM-*, REQ-CAT-*, REQ-DET-*)
-- ---------------------------------------------------------------------
CREATE TABLE reloj (
    id_reloj            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_marca            INTEGER NOT NULL REFERENCES marca (id_marca),
    nombre              VARCHAR(150) NOT NULL,
    genero              VARCHAR(20) NOT NULL,         -- valores por definir (TBD-5)
    precio_cop          BIGINT NOT NULL CHECK (precio_cop > 0),   -- entero positivo (REQ-ADM-3)
    cantidad            INTEGER CHECK (cantidad IS NULL OR cantidad >= 0),  -- significado en TBD-2
    garantia            VARCHAR(150) NOT NULL,        -- dato de cada reloj (RN-5)
    detalle_mecanica    TEXT,                         -- campos exactos en TBD-6
    descripcion         TEXT,
    modo                VARCHAR(12) NOT NULL CHECK (modo IN ('DISPONIBLE', 'BAJO_PEDIDO')),  -- RN-1
    visible             BOOLEAN NOT NULL DEFAULT TRUE,
    plazo_estimado      VARCHAR(60),                  -- solo Bajo pedido, formato en TBD-7
    url_amigable        VARCHAR(160) NOT NULL UNIQUE, -- URL propia y estable (REQ-CAT-7)
    fecha_publicacion   TIMESTAMPTZ NOT NULL DEFAULT now(),   -- orden del catálogo (REQ-CAT-3)
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_reloj_catalogo ON reloj (visible, fecha_publicacion DESC);
CREATE INDEX ix_reloj_marca    ON reloj (id_marca);
CREATE INDEX ix_reloj_genero   ON reloj (genero);
CREATE INDEX ix_reloj_precio   ON reloj (precio_cop);

CREATE TABLE imagen_reloj (
    id_imagen    INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reloj     INTEGER NOT NULL REFERENCES reloj (id_reloj) ON DELETE CASCADE,
    archivo      VARCHAR(255) NOT NULL,               -- ruta o clave en el almacenamiento
    orden        SMALLINT NOT NULL CHECK (orden >= 1),
    es_principal BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (id_reloj, orden)
);

-- Una sola foto principal por reloj (REQ-ADM-10).
CREATE UNIQUE INDEX uq_imagen_principal ON imagen_reloj (id_reloj) WHERE es_principal;

-- Auditoría de precios (SEF-5, prioridad Media).
CREATE TABLE historial_precio (
    id_cambio        INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_reloj         INTEGER NOT NULL REFERENCES reloj (id_reloj),
    id_administrador INTEGER NOT NULL REFERENCES administrador (id_administrador),
    precio_anterior  BIGINT NOT NULL CHECK (precio_anterior > 0),
    precio_nuevo     BIGINT NOT NULL CHECK (precio_nuevo > 0),
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_historial_precio_reloj ON historial_precio (id_reloj, fecha_hora DESC);

-- ---------------------------------------------------------------------
-- Pedidos sin registro (REQ-PED-*, REQ-GPE-*)
-- ---------------------------------------------------------------------
CREATE TABLE pedido (
    id_pedido                 INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    numero_pedido             VARCHAR(20) NOT NULL UNIQUE,      -- número visible para el comprador (REQ-PED-8)
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
    telefono_comprador        VARCHAR(10) NOT NULL CHECK (telefono_comprador ~ '^[0-9]{10}$'),  -- TBD-21
    direccion                 VARCHAR(250) NOT NULL CHECK (btrim(direccion) <> ''),
    -- Evidencia de la autorización de datos personales, Ley 1581 de 2012 (REQ-PED-6, SEI-5)
    fecha_autorizacion_datos  TIMESTAMPTZ NOT NULL,
    motivo_cancelacion        VARCHAR(250),                     -- obligatorio al cancelar (REQ-GPE-6)
    clave_idempotencia        VARCHAR(64) UNIQUE,               -- evita pedidos duplicados (REQ-PED-12)
    fecha_creacion            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_pedido_estado ON pedido (id_estado, fecha_creacion DESC);
CREATE INDEX ix_pedido_reloj  ON pedido (id_reloj);

-- Historial de estados: una fila por cambio, incluida la inicial (REQ-GPE-7).
-- id_administrador es NULL en la fila inicial, que registra el sistema.
CREATE TABLE historial_estado (
    id_historial     INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido        INTEGER NOT NULL REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    id_estado        SMALLINT NOT NULL REFERENCES estado_pedido (id_estado),  -- estado nuevo
    id_administrador INTEGER REFERENCES administrador (id_administrador),
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_historial_estado_pedido ON historial_estado (id_pedido, fecha_hora);

-- Notas internas (REQ-GPE-11, prioridad Media).
CREATE TABLE nota_pedido (
    id_nota          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_pedido        INTEGER NOT NULL REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    id_administrador INTEGER NOT NULL REFERENCES administrador (id_administrador),
    texto            VARCHAR(1000) NOT NULL CHECK (btrim(texto) <> ''),
    fecha_hora       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX ix_nota_pedido ON nota_pedido (id_pedido);

-- ---------------------------------------------------------------------
-- Enlaces de contacto editables (REQ-CON-5, prioridad Baja)
-- Si un tipo no tiene fila, el sitio no muestra su icono (REQ-CON-4).
-- ---------------------------------------------------------------------
CREATE TABLE enlace_contacto (
    id_enlace INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tipo      VARCHAR(15) NOT NULL UNIQUE CHECK (tipo IN ('WHATSAPP', 'INSTAGRAM', 'TIKTOK')),
    valor     VARCHAR(255) NOT NULL,
    activo    BOOLEAN NOT NULL DEFAULT TRUE
);
