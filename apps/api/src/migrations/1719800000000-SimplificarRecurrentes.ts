import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Simplifica los recurrentes a "plantillas": se elimina la maquinaria de cargos
 * mensuales (confirmar/desconfirmar/estados). Los gastos recurrentes ahora se
 * cargan como movimientos normales. Se elimina la tabla cargos_recurrentes.
 * Los movimientos que ya se habían generado quedan intactos.
 */
export class SimplificarRecurrentes1719800000000 implements MigrationInterface {
  name = 'SimplificarRecurrentes1719800000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS cargos_recurrentes CASCADE;`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS cargos_recurrentes (
        id SERIAL PRIMARY KEY,
        recurrente_id INTEGER NOT NULL REFERENCES recurrentes(id) ON DELETE CASCADE,
        mes CHAR(7) NOT NULL,
        monto NUMERIC(14,2),
        estado VARCHAR(20) NOT NULL DEFAULT 'por-confirmar',
        movimiento_id INTEGER REFERENCES movimientos(id),
        UNIQUE(recurrente_id, mes)
      );
    `);
  }
}
