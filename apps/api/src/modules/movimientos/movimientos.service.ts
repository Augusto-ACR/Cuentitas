import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between } from 'typeorm';
import { Movimiento } from '../../entities/movimiento.entity';

export interface FiltrosMovimiento {
  mes?: string;
  tipo?: 'ingreso' | 'gasto';
  categoriaId?: number;
  cuentaId?: number;
  q?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class MovimientosService {
  constructor(
    @InjectRepository(Movimiento) private readonly repo: Repository<Movimiento>,
  ) {}

  async listar(usuarioId: number, filtros: FiltrosMovimiento = {}) {
    const { mes, tipo, categoriaId, cuentaId, q, page = 1, limit = 50 } = filtros;
    const qb = this.repo.createQueryBuilder('m')
      .where('m.usuario_id = :usuarioId', { usuarioId })
      .leftJoinAndSelect('m.categoria', 'cat')
      .leftJoinAndSelect('m.cuenta', 'cuenta')
      .orderBy('m.fecha', 'DESC')
      .addOrderBy('m.id', 'DESC');

    if (mes) {
      qb.andWhere("TO_CHAR(m.fecha::date, 'YYYY-MM') = :mes", { mes });
    }
    if (tipo) qb.andWhere('m.tipo = :tipo', { tipo });
    if (categoriaId) qb.andWhere('m.categoria_id = :categoriaId', { categoriaId });
    if (cuentaId) qb.andWhere('m.cuenta_id = :cuentaId', { cuentaId });
    if (q) qb.andWhere('m.descripcion ILIKE :q', { q: `%${q}%` });

    const total = await qb.getCount();
    const items = await qb.skip((page - 1) * limit).take(limit).getMany();
    return { items, total, page, limit };
  }

  async resumen(usuarioId: number, mes: string) {
    const rows = await this.repo.createQueryBuilder('m')
      .select('m.tipo', 'tipo')
      .addSelect('SUM(m.monto::numeric)', 'total')
      .where('m.usuario_id = :usuarioId', { usuarioId })
      .andWhere("TO_CHAR(m.fecha::date, 'YYYY-MM') = :mes", { mes })
      .groupBy('m.tipo')
      .getRawMany();

    let ingresos = 0, gastos = 0;
    for (const r of rows) {
      if (r.tipo === 'ingreso') ingresos = parseFloat(r.total) || 0;
      if (r.tipo === 'gasto') gastos = parseFloat(r.total) || 0;
    }
    return { mes, ingresos, gastos, balance: ingresos - gastos };
  }

  async crear(usuarioId: number, data: Partial<Movimiento>) {
    const m = this.repo.create({ ...data, usuarioId });
    return this.repo.save(m);
  }

  async actualizar(usuarioId: number, id: number, data: Partial<Movimiento>) {
    const m = await this.repo.findOne({ where: { id, usuarioId } });
    if (!m) throw new NotFoundException();
    Object.assign(m, data);
    return this.repo.save(m);
  }

  async eliminar(usuarioId: number, id: number) {
    const m = await this.repo.findOne({ where: { id, usuarioId } });
    if (!m) throw new NotFoundException();
    await this.repo.remove(m);
    return { ok: true };
  }
}
