import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Movimiento } from '../../entities/movimiento.entity';
import { Cuenta } from '../../entities/cuenta.entity';

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
    private readonly dataSource: DataSource,
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

  // Cuánto mueve el saldo de la cuenta este movimiento: +monto si ingreso, -monto si gasto.
  private delta(tipo: string, monto: any): number {
    return (tipo === 'ingreso' ? 1 : -1) * (parseFloat(monto) || 0);
  }

  // Ajusta el saldo de la cuenta sumando `delta` (puede ser negativo).
  // La aritmética la hace Postgres en numeric para evitar drift de punto flotante.
  private async ajustarSaldo(manager: EntityManager, usuarioId: number, cuentaId: number, delta: number) {
    if (!cuentaId || !delta) return;
    await manager.createQueryBuilder()
      .update(Cuenta)
      .set({ saldo: () => 'saldo + :delta' })
      .where('id = :cuentaId AND usuario_id = :usuarioId', { cuentaId, usuarioId })
      .setParameter('delta', delta)
      .execute();
  }

  async crear(usuarioId: number, data: Partial<Movimiento>) {
    return this.dataSource.transaction(async (manager) => {
      const saved = await manager.save(manager.create(Movimiento, { ...data, usuarioId }));
      await this.ajustarSaldo(manager, usuarioId, saved.cuentaId, this.delta(saved.tipo, saved.monto));
      return saved;
    });
  }

  async actualizar(usuarioId: number, id: number, data: Partial<Movimiento>) {
    return this.dataSource.transaction(async (manager) => {
      const m = await manager.findOne(Movimiento, { where: { id, usuarioId } });
      if (!m) throw new NotFoundException();
      // Revertir el efecto del movimiento anterior sobre su cuenta...
      await this.ajustarSaldo(manager, usuarioId, m.cuentaId, -this.delta(m.tipo, m.monto));
      Object.assign(m, data);
      const saved = await manager.save(m);
      // ...y aplicar el nuevo (puede haber cambiado de cuenta, tipo o monto).
      await this.ajustarSaldo(manager, usuarioId, saved.cuentaId, this.delta(saved.tipo, saved.monto));
      return saved;
    });
  }

  async eliminar(usuarioId: number, id: number) {
    return this.dataSource.transaction(async (manager) => {
      const m = await manager.findOne(Movimiento, { where: { id, usuarioId } });
      if (!m) throw new NotFoundException();
      await this.ajustarSaldo(manager, usuarioId, m.cuentaId, -this.delta(m.tipo, m.monto));
      await manager.remove(m);
      return { ok: true };
    });
  }
}
