/**
 * Seed idempotente: carga el usuario admin (Augusto) con sus datos reales
 * de junio y julio 2026 (sin meses mock). Se puede correr N veces sin duplicar.
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
  entities: [Usuario, Categoria, Cuenta, Recurrente, Movimiento, Meta, MetaParticipante, AporteMeta, CotizacionDolar],
  synchronize: false,
});

// ============================================================
// DATOS DE SEMILLA (de data.js — solo reales, sin mock)
// ============================================================

const CATEGORIAS_BASE = [
  { slug: 'comida',      color: '#F59E0B', label: 'Comida y delivery',    matches: ['Empanadas','Betos Lomos','Betos lomos','McDonals','Milanesas','Pan','Despensa'] },
  { slug: 'subs',        color: '#A855F7', label: 'Suscripciones',        matches: ['Paramount +','Disney +','Claro'] },
  { slug: 'ia',          color: '#EC4899', label: 'IA y software',        matches: ['Claude','Api IA','chip AI'] },
  { slug: 'impresion3d', color: '#06B6D4', label: 'Impresión 3D',         matches: ['Filamentos','Cosas para la impresion 3D'] },
  { slug: 'mascotas',    color: '#10B981', label: 'Mascotas',             matches: ['Comida para perros','Comida animales abuela'] },
  { slug: 'servicios',   color: '#3B82F6', label: 'Servicios e internet', matches: ['Internet PI','Internet casa'] },
  { slug: 'combustible', color: '#F97316', label: 'Combustible',          matches: ['Nafta'] },
  { slug: 'impuestos',   color: '#64748B', label: 'Impuestos',            matches: ['PERC,RG5617','IBB','Iva a serv. dig.','IVA serv. dig.'] },
  { slug: 'tarjeta',     color: '#0EA5E9', label: 'Tarjeta',              matches: ['Pago de tarjeta'] },
  { slug: 'super',       color: '#84CC16', label: 'Supermercado',         matches: [] },
  { slug: 'otros',       color: '#94A3B8', label: 'Otros',                matches: ['Propina PY'] },
];

const CUENTAS = [
  { nombre: 'Naranja X',    saldo: '220496.68', icono: 'wallet' },
  { nombre: 'Galicia',      saldo: '43701.10',  icono: 'wallet' },
  { nombre: 'Mercado Pago', saldo: '3519.22',   icono: 'wallet' },
  { nombre: 'Claro pay',    saldo: '4397.22',   icono: 'wallet' },
];

// Movimientos reales junio 2026
const JUNIO: any[] = [
  { fecha:'2026-06-01', monto:'190000',    tipo:'ingreso', descripcion:'plata mamá',                 catSlug:null,         cuentaNombre:'Naranja X' },
  { fecha:'2026-06-05', monto:'900000',    tipo:'ingreso', descripcion:'plata mamá',                 catSlug:null,         cuentaNombre:'Naranja X' },
  { fecha:'2026-06-10', monto:'250000',    tipo:'ingreso', descripcion:'plata abuela animales',      catSlug:null,         cuentaNombre:'Naranja X' },
  { fecha:'2026-06-22', monto:'100000',    tipo:'ingreso', descripcion:'plata de mamá para comida',  catSlug:null,         cuentaNombre:'Naranja X' },
  { fecha:'2026-06-01', monto:'50000.02',  tipo:'gasto',   descripcion:'Claro',                      catSlug:'subs',       cuentaNombre:'Claro pay' },
  { fecha:'2026-06-01', monto:'30000.00',  tipo:'gasto',   descripcion:'Empanadas',                  catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-01', monto:'40299.99',  tipo:'gasto',   descripcion:'Internet PI',                catSlug:'servicios',  cuentaNombre:'Galicia' },
  { fecha:'2026-06-04', monto:'50206.61',  tipo:'gasto',   descripcion:'Paramount +',                catSlug:'subs',       cuentaNombre:'Naranja X' },
  { fecha:'2026-06-04', monto:'15061.98',  tipo:'gasto',   descripcion:'PERC,RG5617',                catSlug:'impuestos',  cuentaNombre:'Naranja X' },
  { fecha:'2026-06-04', monto:'2008.26',   tipo:'gasto',   descripcion:'IBB',                        catSlug:'impuestos',  cuentaNombre:'Naranja X' },
  { fecha:'2026-06-04', monto:'10543.39',  tipo:'gasto',   descripcion:'Iva a serv. dig.',           catSlug:'impuestos',  cuentaNombre:'Naranja X' },
  { fecha:'2026-06-04', monto:'30329.00',  tipo:'gasto',   descripcion:'Betos Lomos',                catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-04', monto:'750.00',    tipo:'gasto',   descripcion:'Propina PY',                 catSlug:'otros',      cuentaNombre:'Naranja X' },
  { fecha:'2026-06-06', monto:'21000.00',  tipo:'gasto',   descripcion:'Milanesas',                  catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-06', monto:'6670.00',   tipo:'gasto',   descripcion:'Sin descripción',            catSlug:'otros',      cuentaNombre:'Naranja X' },
  { fecha:'2026-06-07', monto:'551227.85', tipo:'gasto',   descripcion:'Pago de tarjeta',            catSlug:'tarjeta',    cuentaNombre:'Galicia' },
  { fecha:'2026-06-07', monto:'58929.53',  tipo:'gasto',   descripcion:'Nafta',                      catSlug:'combustible',cuentaNombre:'Naranja X' },
  { fecha:'2026-06-07', monto:'23999.00',  tipo:'gasto',   descripcion:'Disney +',                   catSlug:'subs',       cuentaNombre:'Naranja X' },
  { fecha:'2026-06-10', monto:'30000.00',  tipo:'gasto',   descripcion:'Empanadas',                  catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-10', monto:'149120.00', tipo:'gasto',   descripcion:'Comida animales abuela',     catSlug:'mascotas',   cuentaNombre:'Naranja X' },
  { fecha:'2026-06-10', monto:'57780.46',  tipo:'gasto',   descripcion:'Internet casa',              catSlug:'servicios',  cuentaNombre:'Galicia' },
  { fecha:'2026-06-14', monto:'63200.00',  tipo:'gasto',   descripcion:'McDonals',                   catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-15', monto:'66180.00',  tipo:'gasto',   descripcion:'Betos lomos',                catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-15', monto:'29580.00',  tipo:'gasto',   descripcion:'Claude',                     catSlug:'ia',         cuentaNombre:'Galicia' },
  { fecha:'2026-06-15', monto:'8700.00',   tipo:'gasto',   descripcion:'PERC,RG5617',                catSlug:'impuestos',  cuentaNombre:'Naranja X' },
  { fecha:'2026-06-17', monto:'5800.00',   tipo:'gasto',   descripcion:'Despensa',                   catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-18', monto:'6500.00',   tipo:'gasto',   descripcion:'chip AI',                    catSlug:'ia',         cuentaNombre:'Galicia' },
  { fecha:'2026-06-21', monto:'1500.00',   tipo:'gasto',   descripcion:'Api IA',                     catSlug:'ia',         cuentaNombre:'Galicia' },
  { fecha:'2026-06-21', monto:'450.00',    tipo:'gasto',   descripcion:'PERC,RG5617',                catSlug:'impuestos',  cuentaNombre:'Naranja X' },
  { fecha:'2026-06-22', monto:'30000.00',  tipo:'gasto',   descripcion:'Empanadas',                  catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-22', monto:'70000.00',  tipo:'gasto',   descripcion:'Filamentos',                 catSlug:'impresion3d',cuentaNombre:'Naranja X' },
  { fecha:'2026-06-25', monto:'6760.00',   tipo:'gasto',   descripcion:'Pan',                        catSlug:'comida',     cuentaNombre:'Naranja X' },
  { fecha:'2026-06-27', monto:'84000.00',  tipo:'gasto',   descripcion:'Comida para perros',         catSlug:'mascotas',   cuentaNombre:'Naranja X' },
  { fecha:'2026-06-27', monto:'9500.00',   tipo:'gasto',   descripcion:'Cosas para la impresion 3D', catSlug:'impresion3d',cuentaNombre:'Naranja X' },
];

// Julio 2026 (en curso)
const JULIO: any[] = [
  { fecha:'2026-07-01', monto:'67943.75', tipo:'gasto', descripcion:'Pago de tarjeta', catSlug:'tarjeta', cuentaNombre:'Galicia' },
];

// Recurrentes con historial
const RECURRENTES = [
  { nombre:'Claro',         catSlug:'subs',      cuentaNombre:'Claro pay', diaAprox:1,  montoEstimado:'50000.02',
    historial:[{mes:'2026-05',monto:'50000',    estado:'confirmado'},{mes:'2026-06',monto:'50000.02',estado:'confirmado'},{mes:'2026-07',monto:null,estado:'por-confirmar'}] },
  { nombre:'Paramount +',   catSlug:'subs',      cuentaNombre:'Naranja X', diaAprox:4,  montoEstimado:'50206.61',
    historial:[{mes:'2026-05',monto:'50000',    estado:'confirmado'},{mes:'2026-06',monto:'50206.61',estado:'confirmado'},{mes:'2026-07',monto:null,estado:'por-confirmar'}] },
  { nombre:'Disney +',      catSlug:'subs',      cuentaNombre:'Naranja X', diaAprox:7,  montoEstimado:'23999.00',
    historial:[{mes:'2026-05',monto:'24000',    estado:'confirmado'},{mes:'2026-06',monto:'23999.00',estado:'confirmado'},{mes:'2026-07',monto:null,estado:'por-confirmar'}] },
  { nombre:'Internet PI',   catSlug:'servicios', cuentaNombre:'Galicia',   diaAprox:1,  montoEstimado:'40299.99',
    historial:[{mes:'2026-05',monto:'40000',    estado:'confirmado'},{mes:'2026-06',monto:'40299.99',estado:'confirmado'},{mes:'2026-07',monto:null,estado:'por-confirmar'}] },
  { nombre:'Claude',        catSlug:'ia',        cuentaNombre:'Galicia',   diaAprox:15, montoEstimado:'29580.00',
    historial:[{mes:'2026-05',monto:'29000',    estado:'confirmado'},{mes:'2026-06',monto:'29580.00',estado:'por-confirmar'},{mes:'2026-07',monto:null,estado:'por-confirmar'}] },
  { nombre:'Internet casa', catSlug:'servicios', cuentaNombre:'Galicia',   diaAprox:10, montoEstimado:'57780.46',
    historial:[{mes:'2026-05',monto:'57000',    estado:'confirmado'},{mes:'2026-06',monto:'57780.46',estado:'por-confirmar'},{mes:'2026-07',monto:null,estado:'por-confirmar'}] },
];

async function run() {
  await ds.initialize();
  console.log('Conectado a la base de datos');

  const usuariosRepo = ds.getRepository(Usuario);
  const catRepo = ds.getRepository(Categoria);
  const cuentaRepo = ds.getRepository(Cuenta);
  const recRepo = ds.getRepository(Recurrente);
  const movRepo = ds.getRepository(Movimiento);
  const metaRepo = ds.getRepository(Meta);
  const partRepo = ds.getRepository(MetaParticipante);
  const dolarRepo = ds.getRepository(CotizacionDolar);

  // 1. Categorías base globales (idempotente por slug+sistema)
  for (const cat of CATEGORIAS_BASE) {
    const existe = await catRepo.findOne({ where: { slug: cat.slug, sistema: true } });
    if (!existe) {
      await catRepo.save(catRepo.create({ ...cat, sistema: true, usuarioId: null }));
    }
  }
  console.log('Categorías base OK');

  // 2. Usuario admin
  let admin = await usuariosRepo.findOne({ where: { username: process.env.ADMIN_USER || 'Augusto' } });
  if (!admin) {
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASS || 'Hele123', 12);
    admin = await usuariosRepo.save(
      usuariosRepo.create({ username: process.env.ADMIN_USER || 'Augusto', nombre: 'Augusto', passwordHash, rol: 'admin', dolarPref: 'blue' }),
    );
    console.log(`Usuario admin creado: ${admin.username}`);
  } else {
    console.log('Usuario admin ya existe, saltando');
  }

  const uid = admin.id;

  // 3. Cuentas (idempotente por nombre+usuario)
  const cuentaMap: Record<string, number> = {};
  for (const c of CUENTAS) {
    let cuenta = await cuentaRepo.findOne({ where: { usuarioId: uid, nombre: c.nombre } });
    if (!cuenta) cuenta = await cuentaRepo.save(cuentaRepo.create({ usuarioId: uid, ...c }));
    cuentaMap[c.nombre] = cuenta.id;
  }
  console.log('Cuentas OK');

  // (Los buckets se eliminaron: los ahorros ahora se llevan como Metas)

  // Mapa de categorías por slug
  const cats = await catRepo.find();
  const catMap: Record<string, number> = Object.fromEntries(cats.map(c => [c.slug, c.id]));

  // 5. Recurrentes (plantillas de gastos que se repiten)
  for (const r of RECURRENTES) {
    const existe = await recRepo.findOne({ where: { usuarioId: uid, nombre: r.nombre } });
    if (!existe) {
      await recRepo.save(recRepo.create({
        usuarioId: uid,
        nombre: r.nombre,
        categoriaId: catMap[r.catSlug] ?? null,
        cuentaId: cuentaMap[r.cuentaNombre],
        diaAprox: r.diaAprox,
        montoEstimado: r.montoEstimado,
      }));
    }
  }
  console.log('Recurrentes OK');

  // 6. Movimientos reales (idempotente: dedup fecha+monto+desc+usuario)
  let movCreados = 0;
  for (const m of [...JUNIO, ...JULIO]) {
    const existe = await movRepo.findOne({ where: { usuarioId: uid, fecha: m.fecha, monto: m.monto, descripcion: m.descripcion } });
    if (!existe) {
      await movRepo.save(movRepo.create({
        usuarioId: uid,
        fecha: m.fecha,
        monto: m.monto,
        tipo: m.tipo,
        descripcion: m.descripcion,
        categoriaId: m.catSlug ? catMap[m.catSlug] : null,
        cuentaId: cuentaMap[m.cuentaNombre],
      }));
      movCreados++;
    }
  }
  console.log(`Movimientos OK (${movCreados} nuevos)`);

  // Verificar balance junio
  const gastos = JUNIO.filter(m => m.tipo === 'gasto').reduce((a, m) => a + parseFloat(m.monto), 0);
  const ingresos = JUNIO.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + parseFloat(m.monto), 0);
  console.log(`Balance junio: ${ingresos - gastos} (esperado: -70096.09)`);

  // 7. Meta personal (vacía)
  let metaPersonal = await metaRepo.findOne({ where: { ownerId: uid, titulo: 'Meta personal' } });
  if (!metaPersonal) {
    metaPersonal = await metaRepo.save(metaRepo.create({ ownerId: uid, titulo: 'Meta personal', objetivoUSD: '2500', plazoMeses: 10, tipo: 'personal' }));
    await partRepo.save(partRepo.create({ metaId: metaPersonal.id, usuarioId: uid, rol: 'owner' }));
  }

  // 8. Meta compartida con Cande (owner: Augusto, sin segundo participante real aún)
  let metaCande = await metaRepo.findOne({ where: { ownerId: uid, titulo: 'Ahorro con Cande' } });
  if (!metaCande) {
    metaCande = await metaRepo.save(metaRepo.create({ ownerId: uid, titulo: 'Ahorro con Cande', objetivoUSD: '2000', plazoMeses: 12, tipo: 'compartida' }));
    await partRepo.save(partRepo.create({ metaId: metaCande.id, usuarioId: uid, rol: 'owner' }));
  }
  console.log('Metas OK');

  // 9. Cotización dólar inicial
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
