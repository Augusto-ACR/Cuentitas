import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { InitialSchema1719500000000 } from './migrations/1719500000000-InitialSchema';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  migrations: [InitialSchema1719500000000],
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
