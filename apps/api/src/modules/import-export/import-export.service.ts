import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Movimiento } from '../../entities/movimiento.entity';
import { Cuenta } from '../../entities/cuenta.entity';
import { CategoriasService } from '../categorias/categorias.service';

@Injectable()
export class ImportExportService {
  constructor(
    @InjectRepository(Movimiento) private readonly movimientos: Repository<Movimiento>,
    @InjectRepository(Cuenta) private readonly cuentas: Repository<Cuenta>,
    private readonly categorias: CategoriasService,
  ) {}

  async plantillaBuffer(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Movimientos');
    ws.columns = [
      { header: 'fecha (YYYY-MM-DD)', key: 'fecha', width: 18 },
      { header: 'tipo (ingreso/gasto)', key: 'tipo', width: 20 },
      { header: 'monto', key: 'monto', width: 14 },
      { header: 'descripcion', key: 'descripcion', width: 30 },
      { header: 'categoria (slug)', key: 'categoria', width: 20 },
      { header: 'cuenta (nombre)', key: 'cuenta', width: 20 },
    ];
    ws.addRow({ fecha: '2026-06-01', tipo: 'ingreso', monto: 100000, descripcion: 'Ejemplo ingreso', categoria: '', cuenta: 'Naranja X' });
    ws.addRow({ fecha: '2026-06-02', tipo: 'gasto', monto: 5000, descripcion: 'Ejemplo gasto', categoria: 'comida', cuenta: 'Naranja X' });
    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  async preview(usuarioId: number, buffer: Buffer) {
    const rows = await this.parseExcel(buffer);
    // Solo cuentas en pesos: las USD son para ahorro y no reciben movimientos.
    const cuentasUsuario = (await this.cuentas.find({ where: { usuarioId } })).filter(c => c.moneda !== 'USD');
    const cuentaMap = Object.fromEntries(cuentasUsuario.map(c => [c.nombre.toLowerCase(), c]));

    const validos: any[] = [], sinCategoria: any[] = [], duplicados: any[] = [], errores: any[] = [];

    for (const row of rows) {
      if (!row.fecha || !row.tipo || !row.monto) {
        errores.push({ ...row, error: 'Faltan campos obligatorios (fecha, tipo, monto)' });
        continue;
      }
      if (!['ingreso', 'gasto'].includes(row.tipo)) {
        errores.push({ ...row, error: 'tipo debe ser ingreso o gasto' });
        continue;
      }
      const monto = parseFloat(String(row.monto));
      if (isNaN(monto) || monto <= 0) {
        errores.push({ ...row, error: 'monto inválido' });
        continue;
      }

      const cuenta = cuentaMap[String(row.cuenta ?? '').toLowerCase()];
      const cuentaId = cuenta?.id ?? cuentasUsuario[0]?.id;

      // Autocategorización por matches
      const categoriaId = row.categoria
        ? null
        : await this.categorias.findMatching(usuarioId, String(row.descripcion ?? ''));

      // Dedup: fecha + monto + descripcion del usuario
      const dup = await this.movimientos.findOne({
        where: { usuarioId, fecha: row.fecha, monto: String(monto), descripcion: String(row.descripcion ?? '') },
      });

      const item = { ...row, monto, cuentaId, categoriaId };

      if (dup) { duplicados.push(item); continue; }
      if (!categoriaId && row.tipo === 'gasto') sinCategoria.push(item);
      else validos.push(item);
    }

    return { validos, sinCategoria, duplicados, errores };
  }

  async confirmar(usuarioId: number, items: any[]) {
    const movs = items.map(i => this.movimientos.create({
      usuarioId,
      fecha: i.fecha,
      monto: String(i.monto),
      tipo: i.tipo,
      descripcion: i.descripcion ?? '',
      categoriaId: i.categoriaId ?? null,
      cuentaId: i.cuentaId,
    }));
    await this.movimientos.save(movs);
    return { importados: movs.length };
  }

  async exportar(usuarioId: number): Promise<Buffer> {
    const movs = await this.movimientos.find({
      where: { usuarioId },
      relations: ['categoria', 'cuenta'],
      order: { fecha: 'DESC' },
    });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Movimientos');
    ws.columns = [
      { header: 'fecha', key: 'fecha', width: 14 },
      { header: 'tipo', key: 'tipo', width: 10 },
      { header: 'monto', key: 'monto', width: 16 },
      { header: 'descripcion', key: 'descripcion', width: 35 },
      { header: 'categoria', key: 'categoria', width: 22 },
      { header: 'cuenta', key: 'cuenta', width: 20 },
    ];
    for (const m of movs) {
      ws.addRow({
        fecha: m.fecha,
        tipo: m.tipo,
        monto: parseFloat(m.monto),
        descripcion: m.descripcion,
        categoria: m.categoria?.label ?? '',
        cuenta: m.cuenta?.nombre ?? '',
      });
    }
    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }

  private async parseExcel(buffer: Buffer) {
    const wb = new ExcelJS.Workbook();
    await (wb.xlsx.load as (b: unknown) => Promise<ExcelJS.Workbook>)(buffer);
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Excel vacío o inválido');

    const headers: string[] = [];
    ws.getRow(1).eachCell(c => headers.push(String(c.value ?? '').toLowerCase().split(' ')[0]));

    const rows: any[] = [];
    ws.eachRow((row, idx) => {
      if (idx === 1) return;
      const obj: any = {};
      row.eachCell((cell, col) => {
        const key = headers[col - 1];
        if (key) obj[key] = cell.value;
      });
      if (Object.keys(obj).length > 0) rows.push(obj);
    });
    return rows;
  }
}
