import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Unifica los "ahorros" en las Metas:
 *  - El objetivo y el plazo de una meta pasan a ser opcionales (ahorro sin meta fija).
 *  - Un aporte sale de una cuenta (transferencia): se agrega cuenta_id en aportes_meta.
 *  - Se elimina la tabla buckets (sus datos estaban en 0).
 */
export class AhorrosUnificados1719600000000 implements MigrationInterface {
  name = 'AhorrosUnificados1719600000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE metas ALTER COLUMN objetivo_usd DROP NOT NULL;`);
    await qr.query(`ALTER TABLE metas ALTER COLUMN plazo_meses DROP NOT NULL;`);
    await qr.query(`ALTER TABLE aportes_meta ADD COLUMN IF NOT EXISTS cuenta_id INTEGER REFERENCES cuentas(id);`);
    await qr.query(`DROP TABLE IF EXISTS buckets CASCADE;`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS buckets (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        monto NUMERIC(14,2) NOT NULL DEFAULT 0
      );
    `);
    await qr.query(`ALTER TABLE aportes_meta DROP COLUMN IF EXISTS cuenta_id;`);
    await qr.query(`ALTER TABLE metas ALTER COLUMN plazo_meses SET NOT NULL;`);
    await qr.query(`ALTER TABLE metas ALTER COLUMN objetivo_usd SET NOT NULL;`);
  }
}
