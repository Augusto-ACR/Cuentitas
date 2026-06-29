/**
 * Seed generalizado e idempotente: crea el usuario admin, las categorías base
 * genéricas y las cotizaciones iniciales del dólar. Cada usuario carga después
 * sus propias cuentas y movimientos. Se puede correr N veces sin duplicar.
 *
 * Uso: npm run seed  (desde apps/api)
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from './entities/usuario.entity';
import { Categoria } from './entities/categoria.entity';
import { Cuenta } from './entities/cuenta.entity';
import { Recurrente } from './entities/recurrente.entity';
import { Movimiento } from './entities/movimiento.entity';
import { Meta } from './entities/meta.entity';
import { MetaParticipante } from './entities/meta-participante.entity';
import { AporteMeta } from './entities/aporte-meta.entity';
import { CotizacionDolar } from './entities/cotizacion-dolar.entity';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // Se listan todas las entidades porque Usuario tiene relaciones hacia ellas.
  entities: [Usuario, Categoria, Cuenta, Recurrente, Movimiento, Meta, MetaParticipante, AporteMeta, CotizacionDolar],
  synchronize: false,
});

// Categorías globales genéricas (le sirven a cualquier persona).
const CATEGORIAS_BASE = [
  { slug: 'comida',     color: '#F59E0B', label: 'Comida y delivery',    matches: [] },
  { slug: 'super',      color: '#84CC16', label: 'Supermercado',         matches: [] },
  { slug: 'transporte', color: '#F97316', label: 'Transporte',           matches: [] },
  { slug: 'servicios',  color: '#3B82F6', label: 'Servicios e internet', matches: [] },
  { slug: 'subs',       color: '#A855F7', label: 'Suscripciones',        matches: [] },
  { slug: 'salud',      color: '#EF4444', label: 'Salud',                matches: [] },
  { slug: 'ocio',       color: '#8B5CF6', label: 'Ocio y salidas',       matches: [] },
  { slug: 'hogar',      color: '#14B8A6', label: 'Hogar',                matches: [] },
  { slug: 'mascotas',   color: '#10B981', label: 'Mascotas',             matches: [] },
  { slug: 'impuestos',  color: '#64748B', label: 'Impuestos',            matches: [] },
  { slug: 'tarjeta',    color: '#0EA5E9', label: 'Tarjeta y pagos',      matches: [] },
  { slug: 'otros',      color: '#94A3B8', label: 'Otros',                matches: [] },
];

async function run() {
  await ds.initialize();
  console.log('Conectado a la base de datos');

  const usuariosRepo = ds.getRepository(Usuario);
  const catRepo = ds.getRepository(Categoria);
  const dolarRepo = ds.getRepository(CotizacionDolar);

  // 1. Categorías base globales genéricas (idempotente por slug+sistema)
  for (const cat of CATEGORIAS_BASE) {
    const existe = await catRepo.findOne({ where: { slug: cat.slug, sistema: true } });
    if (!existe) await catRepo.save(catRepo.create({ ...cat, sistema: true, usuarioId: null }));
  }
  console.log('Categorías base OK');

  // 2. Usuario admin
  const adminUser = process.env.ADMIN_USER || 'Augusto';
  let admin = await usuariosRepo.findOne({ where: { username: adminUser } });
  if (!admin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASS || 'Hele123', 12);
    admin = await usuariosRepo.save(
      usuariosRepo.create({ username: adminUser, nombre: adminUser, passwordHash, rol: 'admin', dolarPref: 'blue' }),
    );
    console.log(`Usuario admin creado: ${admin.username}`);
  } else {
    console.log('Usuario admin ya existe, saltando');
  }

  // 3. Cotización dólar inicial (fallback hasta el primer fetch del cron)
  const dolarExiste = await dolarRepo.findOne({ where: { fuente: 'seed' } });
  if (!dolarExiste) {
    await dolarRepo.save(dolarRepo.create({ tipo: 'blue', compra: '1470', venta: '1478', valor: '1478', fuente: 'seed' }));
    await dolarRepo.save(dolarRepo.create({ tipo: 'oficial', compra: '990', venta: '1000', valor: '1000', fuente: 'seed' }));
    await dolarRepo.save(dolarRepo.create({ tipo: 'mep', compra: '1390', venta: '1400', valor: '1400', fuente: 'seed' }));
  }
  console.log('Cotizaciones iniciales OK');

  await ds.destroy();
  console.log('Seed completado exitosamente');
}

run().catch(e => { console.error(e); process.exit(1); });
