import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega el estado "completada" a las metas (logro festejado y cerrado).
 */
export class MetaCompletada1719700000000 implements MigrationInterface {
  name = 'MetaCompletada1719700000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE metas ADD COLUMN IF NOT EXISTS completada BOOLEAN NOT NULL DEFAULT FALSE;`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE metas DROP COLUMN IF EXISTS completada;`);
  }
}
