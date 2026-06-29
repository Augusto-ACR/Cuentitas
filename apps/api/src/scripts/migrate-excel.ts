/**
 * Script one-off para migrar el historial del Excel personal de Augusto.
 * Layout: hojas por mes, bloques de 3 columnas (fecha · monto · descripción).
 * Solo asigna movimientos al usuario admin.
 *
 * Uso: npm run migrate:excel -- /ruta/al/archivo.xlsx
 */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import * as path from 'path';
import { Movimiento } from '../entities/movimiento.entity';
import { Usuario } from '../entities/usuario.entity';
import { Categoria } from '../entities/categoria.entity';
import { Cuenta } from '../entities/cuenta.entity';

const ds = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Movimiento, Usuario, Categoria, Cuenta],
  synchronize: false,
});

async function run() {
  const filePath = process.argv[2];
  if (!filePath) { console.error('Uso: npm run migrate:excel -- <archivo.xlsx>'); process.exit(1); }

  await ds.initialize();

  const adminRepo = ds.getRepository(Usuario);
  const admin = await adminRepo.findOne({ where: { username: process.env.ADMIN_USER || 'Augusto' } });
  if (!admin) { console.error('Usuario admin no encontrado. Corré el seed primero.'); process.exit(1); }

  const cats = await ds.getRepository(Categoria).find();
  const catMap: Record<string, number> = {};
  for (const c of cats) {
    for (const m of (c.matches || [])) catMap[m.toLowerCase()] = c.id;
  }

  const cuentas = await ds.getRepository(Cuenta).find({ where: { usuarioId: admin.id } });
  const defaultCuenta = cuentas.find(c => c.nombre === 'Naranja X') ?? cuentas[0];

  const movRepo = ds.getRepository(Movimiento);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path.resolve(filePath));

  let total = 0, saltados = 0;

  for (const ws of wb.worksheets) {
    console.log(`Procesando hoja: ${ws.name}`);
    ws.eachRow((row, idx) => {
      if (idx < 2) return; // saltar header
      const fechaRaw = row.getCell(1).value;
      const montoRaw = row.getCell(2).value;
      const desc = String(row.getCell(3).value ?? '').trim();
      if (!fechaRaw || !montoRaw || !desc) return;

      let fecha: string;
      if (fechaRaw instanceof Date) {
        fecha = fechaRaw.toISOString().split('T')[0];
      } else {
        fecha = String(fechaRaw).trim();
      }
      const monto = Math.abs(parseFloat(String(montoRaw)));
      if (isNaN(monto) || monto <= 0) return;

      // Autocategorizar
      const descLower = desc.toLowerCase();
      let categoriaId: number = null;
      for (const [match, catId] of Object.entries(catMap)) {
        if (descLower.includes(match)) { categoriaId = catId; break; }
      }

      movRepo.save(movRepo.create({
        usuarioId: admin.id,
        fecha,
        monto: String(monto),
        tipo: 'gasto',
        descripcion: desc,
        categoriaId,
        cuentaId: defaultCuenta.id,
      })).then(() => total++).catch(() => saltados++);
    });
  }

  // Esperar que termine
  await new Promise(r => setTimeout(r, 3000));
  console.log(`Migración completada: ${total} movimientos, ${saltados} errores/duplicados`);
  await ds.destroy();
}

run().catch(e => { console.error(e); process.exit(1); });
