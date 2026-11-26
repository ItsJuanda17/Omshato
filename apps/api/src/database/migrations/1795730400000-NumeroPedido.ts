import type { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Secuencia del número visible del pedido ("OMS-0001", REQ-PED-8). Una secuencia entrega
 * cada número una sola vez aunque dos compradores pidan a la vez; si un pedido falla a medias
 * el número se salta, algo que al comprador no le importa y que evita repetir uno.
 */
export class NumeroPedido1795730400000 implements MigrationInterface {
  name = "NumeroPedido1795730400000";

  async up(queryRunner: QueryRunner) {
    await queryRunner.query("CREATE SEQUENCE numero_pedido_seq START 1");
  }

  async down(queryRunner: QueryRunner) {
    await queryRunner.query("DROP SEQUENCE IF EXISTS numero_pedido_seq");
  }
}
