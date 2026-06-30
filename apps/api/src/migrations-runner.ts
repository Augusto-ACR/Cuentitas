import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { InitialSchema1719500000000 } from './migrations/1719500000000-InitialSchema';
import { AhorrosUnificados1719600000000 } from './migrations/1719600000000-AhorrosUnificados';
import { MetaCompletada1719700000000 } from './migrations/1719700000000-MetaCompletada';
import { SimplificarRecurrentes1719800000000 } from './migrations/1719800000000-SimplificarRecurrentes';
import { CategoriasGenericas1719900000000 } from './migrations/1719900000000-CategoriasGenericas';
import { MonedaUSD1720000000000 } from './migrations/1720000000000-MonedaUSD';
import { BotVinculacion1720100000000 } from './migrations/1720100000000-BotVinculacion';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // La base corre como contenedor interno de Docker (red privada, sin SSL).
  // Solo activar SSL si se usa una base externa gestionada: DB_SSL=true.
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  migrations: [InitialSchema1719500000000, AhorrosUnificados1719600000000, MetaCompletada1719700000000, SimplificarRecurrentes1719800000000, CategoriasGenericas1719900000000, MonedaUSD1720000000000, BotVinculacion1720100000000],
  migrationsTableName: 'typeorm_migrations',
});

async function run() {
  await ds.initialize();
  console.log('Ejecutando migraciones pendientes…');
  const ran = await ds.runMigrations({ transaction: 'all' });
  console.log(`Migraciones ejecutadas: ${ran.length}`);
  await ds.destroy();
}

run().catch(err => { console.error(err); process.exit(1); });
