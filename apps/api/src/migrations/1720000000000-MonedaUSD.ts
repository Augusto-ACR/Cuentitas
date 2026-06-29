import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Soporte de ahorro en dólares (sin dolarizar):
 *  - cuentas.moneda: 'ARS' (default) o 'USD'. Una cuenta USD guarda su saldo en
 *    dólares; se convierte a pesos solo para el patrimonio total.
 *  - aportes_meta.moneda + monto_usd: un aporte/retiro puede hacerse en dólares.
 *    En ese caso monto_usd guarda el valor nativo en USD (lo que cuenta para el
 *    progreso de la meta) y monto_ars una valuación en pesos del día (para los
 *    totales en ARS). Los registros viejos quedan como 'ARS' (sin cambios).
 */
export class MonedaUSD1720000000000 implements MigrationInterface {
  name = 'MonedaUSD1720000000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE cuentas ADD COLUMN IF NOT EXISTS moneda varchar(3) NOT NULL DEFAULT 'ARS'`);
    await qr.query(`ALTER TABLE aportes_meta ADD COLUMN IF NOT EXISTS moneda varchar(3) NOT NULL DEFAULT 'ARS'`);
    await qr.query(`ALTER TABLE aportes_meta ADD COLUMN IF NOT EXISTS monto_usd numeric(14,2)`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`ALTER TABLE aportes_meta DROP COLUMN IF EXISTS monto_usd`);
    await qr.query(`ALTER TABLE aportes_meta DROP COLUMN IF EXISTS moneda`);
    await qr.query(`ALTER TABLE cuentas DROP COLUMN IF EXISTS moneda`);
  }
}
