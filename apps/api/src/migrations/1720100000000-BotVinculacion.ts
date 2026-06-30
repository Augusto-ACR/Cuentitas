import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Vinculación teléfono↔usuario para el bot de WhatsApp.
 *  - Una fila por usuario (usuario_id único).
 *  - telefono único y nullable (se graba al confirmar la vinculación con el código).
 *  - codigo de un solo uso + codigo_expira para el flujo de vinculación desde la web.
 */
export class BotVinculacion1720100000000 implements MigrationInterface {
  name = 'BotVinculacion1720100000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS bot_vinculaciones (
        id SERIAL PRIMARY KEY,
        usuario_id integer NOT NULL UNIQUE REFERENCES usuarios(id) ON DELETE CASCADE,
        telefono varchar(40) UNIQUE,
        verificado_at timestamptz,
        codigo varchar(12),
        codigo_expira timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    // Búsqueda por código vigente durante la vinculación.
    await qr.query(`CREATE INDEX IF NOT EXISTS idx_bot_vinc_codigo ON bot_vinculaciones (codigo)`);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`DROP TABLE IF EXISTS bot_vinculaciones`);
  }
}
