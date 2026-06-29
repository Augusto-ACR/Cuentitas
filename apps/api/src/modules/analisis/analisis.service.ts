import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Movimiento } from '../../entities/movimiento.entity';

@Injectable()
export class AnalisisService {
  constructor(
    @InjectRepository(Movimiento) private readonly repo: Repository<Movimiento>,
  ) {}

  async tendencia(usuarioId: number) {
    const rows = await this.repo
      .createQueryBuilder('m')
      .select("TO_CHAR(m.fecha::date, 'YYYY-MM')", 'mes')
      .addSelect('m.tipo', 'tipo')
      .addSelect('SUM(m.monto::numeric)', 'total')
      .where('m.usuario_id = :usuarioId', { usuarioId })
      .groupBy("TO_CHAR(m.fecha::date, 'YYYY-MM'), m.tipo")
      .orderBy("TO_CHAR(m.fecha::date, 'YYYY-MM')", 'ASC')
      .getRawMany();

    const meses: Record<string, { ingresos: number; gastos: number; balance: number }> = {};
    for (const r of rows) {
      if (!meses[r.mes]) meses[r.mes] = { ingresos: 0, gastos: 0, balance: 0 };
      const val = parseFloat(r.total) || 0;
      if (r.tipo === 'ingreso') meses[r.mes].ingresos = val;
      if (r.tipo === 'gasto') meses[r.mes].gastos = val;
    }
    for (const mes of Object.keys(meses)) {
      meses[mes].balance = meses[mes].ingresos - meses[mes].gastos;
    }
    return meses;
  }

  async porCategoria(usuarioId: number, mes: string) {
    return this.repo
      .createQueryBuilder('m')
      .select('cat.id', 'categoriaId')
      .addSelect('cat.label', 'label')
      .addSelect('cat.color', 'color')
      .addSelect('SUM(m.monto::numeric)', 'total')
      .leftJoin('m.categoria', 'cat')
      .where('m.usuario_id = :usuarioId', { usuarioId })
      .andWhere('m.tipo = :tipo', { tipo: 'gasto' })
      .andWhere("TO_CHAR(m.fecha::date, 'YYYY-MM') = :mes", { mes })
      .groupBy('cat.id, cat.label, cat.color')
      .orderBy('SUM(m.monto::numeric)', 'DESC')
      .getRawMany();
  }

  async topDescripciones(usuarioId: number, mes: string) {
    return this.repo
      .createQueryBuilder('m')
      .select('m.descripcion', 'descripcion')
      .addSelect('SUM(m.monto::numeric)', 'total')
      .where('m.usuario_id = :usuarioId', { usuarioId })
      .andWhere('m.tipo = :tipo', { tipo: 'gasto' })
      .andWhere("TO_CHAR(m.fecha::date, 'YYYY-MM') = :mes", { mes })
      .groupBy('m.descripcion')
      .orderBy('SUM(m.monto::numeric)', 'DESC')
      .limit(10)
      .getRawMany();
  }
}
