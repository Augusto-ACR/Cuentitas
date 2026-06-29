import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Generaliza las categorías globales para uso familiar:
 *  - Agrega categorías genéricas que faltaban (transporte, salud, ocio, hogar).
 *  - Las categorías muy específicas del admin (IA, impresión 3D, combustible)
 *    dejan de ser globales y pasan a ser propias del admin: las sigue viendo y
 *    sus movimientos quedan intactos, pero los demás miembros no las ven.
 */
export class CategoriasGenericas1719900000000 implements MigrationInterface {
  name = 'CategoriasGenericas1719900000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      INSERT INTO categorias (slug, color, label, matches, sistema, usuario_id)
      SELECT v.slug, v.color, v.label, '[]'::jsonb, true, NULL
      FROM (VALUES
        ('transporte', '#F97316', 'Transporte'),
        ('salud',      '#EF4444', 'Salud'),
        ('ocio',       '#8B5CF6', 'Ocio y salidas'),
        ('hogar',      '#14B8A6', 'Hogar')
      ) AS v(slug, color, label)
      WHERE NOT EXISTS (
        SELECT 1 FROM categorias c WHERE c.slug = v.slug AND c.sistema = true
      );
    `);

    await qr.query(`
      UPDATE categorias
      SET sistema = false,
          usuario_id = (SELECT id FROM usuarios WHERE rol = 'admin' ORDER BY id LIMIT 1)
      WHERE sistema = true
        AND slug IN ('ia', 'impresion3d', 'combustible')
        AND EXISTS (SELECT 1 FROM usuarios WHERE rol = 'admin');
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      UPDATE categorias SET sistema = true, usuario_id = NULL
      WHERE slug IN ('ia', 'impresion3d', 'combustible');
    `);
    await qr.query(`DELETE FROM categorias WHERE sistema = true AND slug IN ('transporte','salud','ocio','hogar');`);
  }
}
