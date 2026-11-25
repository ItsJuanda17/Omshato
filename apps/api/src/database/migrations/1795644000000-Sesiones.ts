import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Sesiones del administrador (REQ-AUT-1, REQ-AUT-5). No estaban en el modelo
 * físico de referencia porque dependen de cómo se implemente la sesión: aquí
 * viven en el servidor, y la cookie solo lleva un token opaco.
 *
 * `id_sesion` es el SHA-256 del token (base64url, 43 caracteres): el token nunca se guarda,
 * así que una copia de la base no sirve para suplantar a nadie.
 */
export class Sesiones1795644000000 implements MigrationInterface {
  name = "Sesiones1795644000000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query(`
      CREATE TABLE sesion (
          id_sesion        VARCHAR(64) PRIMARY KEY,
          id_administrador INTEGER NOT NULL REFERENCES administrador (id_administrador) ON DELETE CASCADE,
          fecha_creacion   TIMESTAMPTZ NOT NULL,
          -- Vencimiento absoluto: la actividad nunca lo extiende.
          fecha_expiracion TIMESTAMPTZ NOT NULL,
          -- Última actividad, para el cierre por inactividad (REQ-AUT-5).
          ultima_actividad TIMESTAMPTZ NOT NULL,
          metadatos        JSONB
      );

      CREATE INDEX ix_sesion_administrador ON sesion (id_administrador);
      CREATE INDEX ix_sesion_expiracion    ON sesion (fecha_expiracion);
    `);
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query(`DROP TABLE IF EXISTS sesion`);
  }
}
