import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1719500000000 implements MigrationInterface {
  name = 'InitialSchema1719500000000';

  public async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        nombre VARCHAR(100) NOT NULL,
        rol VARCHAR(10) NOT NULL DEFAULT 'miembro',
        dolar_pref VARCHAR(10) NOT NULL DEFAULT 'blue',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categorias (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(50) NOT NULL,
        color VARCHAR(7) NOT NULL,
        label VARCHAR(100) NOT NULL,
        matches JSONB NOT NULL DEFAULT '[]',
        sistema BOOLEAN NOT NULL DEFAULT FALSE,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cuentas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        saldo NUMERIC(14,2) NOT NULL DEFAULT 0,
        icono VARCHAR(50) NOT NULL DEFAULT 'wallet'
      );

      CREATE TABLE IF NOT EXISTS buckets (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        monto NUMERIC(14,2) NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS recurrentes (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre VARCHAR(100) NOT NULL,
        categoria_id INTEGER REFERENCES categorias(id),
        cuenta_id INTEGER NOT NULL REFERENCES cuentas(id),
        dia_aprox INTEGER NOT NULL DEFAULT 1,
        monto_estimado NUMERIC(14,2) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS movimientos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        fecha DATE NOT NULL,
        monto NUMERIC(14,2) NOT NULL,
        tipo VARCHAR(10) NOT NULL,
        descripcion VARCHAR(255) NOT NULL,
        categoria_id INTEGER REFERENCES categorias(id),
        cuenta_id INTEGER NOT NULL REFERENCES cuentas(id),
        recurrente_id INTEGER REFERENCES recurrentes(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cargos_recurrentes (
        id SERIAL PRIMARY KEY,
        recurrente_id INTEGER NOT NULL REFERENCES recurrentes(id) ON DELETE CASCADE,
        mes CHAR(7) NOT NULL,
        monto NUMERIC(14,2),
        estado VARCHAR(20) NOT NULL DEFAULT 'por-confirmar',
        movimiento_id INTEGER REFERENCES movimientos(id),
        UNIQUE(recurrente_id, mes)
      );

      CREATE TABLE IF NOT EXISTS metas (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        titulo VARCHAR(150) NOT NULL,
        objetivo_usd NUMERIC(14,2) NOT NULL,
        plazo_meses INTEGER NOT NULL,
        tipo VARCHAR(20) NOT NULL DEFAULT 'personal',
        rate_type_override VARCHAR(10)
      );

      CREATE TABLE IF NOT EXISTS meta_participantes (
        id SERIAL PRIMARY KEY,
        meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        rol VARCHAR(20) NOT NULL DEFAULT 'participante',
        UNIQUE(meta_id, usuario_id)
      );

      CREATE TABLE IF NOT EXISTS aportes_meta (
        id SERIAL PRIMARY KEY,
        meta_id INTEGER NOT NULL REFERENCES metas(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
        monto_ars NUMERIC(14,2) NOT NULL,
        fecha DATE NOT NULL,
        valor_oficial NUMERIC(14,2) NOT NULL,
        valor_mep NUMERIC(14,2) NOT NULL,
        valor_blue NUMERIC(14,2) NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS cotizaciones_dolar (
        id SERIAL PRIMARY KEY,
        fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        tipo VARCHAR(10) NOT NULL,
        compra NUMERIC(14,2) NOT NULL,
        venta NUMERIC(14,2) NOT NULL,
        valor NUMERIC(14,2) NOT NULL,
        fuente VARCHAR(50) NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_fecha ON movimientos(usuario_id, fecha);
      CREATE INDEX IF NOT EXISTS idx_cotizaciones_tipo_fecha ON cotizaciones_dolar(tipo, fecha DESC);
    `);
  }

  public async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      DROP TABLE IF EXISTS cotizaciones_dolar CASCADE;
      DROP TABLE IF EXISTS aportes_meta CASCADE;
      DROP TABLE IF EXISTS meta_participantes CASCADE;
      DROP TABLE IF EXISTS metas CASCADE;
      DROP TABLE IF EXISTS cargos_recurrentes CASCADE;
      DROP TABLE IF EXISTS movimientos CASCADE;
      DROP TABLE IF EXISTS recurrentes CASCADE;
      DROP TABLE IF EXISTS buckets CASCADE;
      DROP TABLE IF EXISTS cuentas CASCADE;
      DROP TABLE IF EXISTS categorias CASCADE;
      DROP TABLE IF EXISTS usuarios CASCADE;
    `);
  }
}
