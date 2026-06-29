import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Recurrente } from '../../entities/recurrente.entity';
import { CargoRecurrente } from '../../entities/cargo-recurrente.entity';
import { Movimiento } from '../../entities/movimiento.entity';
import { Cuenta } from '../../entities/cuenta.entity';

@Injectable()
export class RecurrentesService {
  private readonly logger = new Logger(RecurrentesService.name);

  constructor(
    @InjectRepository(Recurrente) private readonly recurrentes: Repository<Recurrente>,
    @InjectRepository(CargoRecurrente) private readonly cargos: Repository<CargoRecurrente>,
    @InjectRepository(Movimiento) private readonly movimientos: Repository<Movimiento>,
    private readonly dataSource: DataSource,
  ) {}

  async listar(usuarioId: number, mes?: string) {
    const recs = await this.recurrentes.find({
      where: { usuarioId },
      relations: ['categoria', 'cuenta'],
      order: { nombre: 'ASC' },
    });

    if (!mes) return recs;

    const recIds = recs.map(r => r.id);
    if (recIds.length === 0) return recs;

    const cargosDelMes = await this.cargos
      .createQueryBuilder('c')
      .where('c.recurrente_id IN (:...ids)', { ids: recIds })
      .andWhere('c.mes = :mes', { mes })
      .getMany();

    const cargoMap = Object.fromEntries(cargosDelMes.map(c => [c.recurrenteId, c]));
    return recs.map(r => ({ ...r, cargoMes: cargoMap[r.id] ?? null }));
  }

  async crear(usuarioId: number, data: any) {
    const r = this.recurrentes.create({ ...data, usuarioId });
    return this.recurrentes.save(r);
  }

  async actualizar(usuarioId: number, id: number, data: any) {
    const r = await this.recurrentes.findOne({ where: { id, usuarioId } });
    if (!r) throw new NotFoundException();
    Object.assign(r, data);
    return this.recurrentes.save(r);
  }

  async eliminar(usuarioId: number, id: number) {
    const r = await this.recurrentes.findOne({ where: { id, usuarioId } });
    if (!r) throw new NotFoundException();
    await this.recurrentes.remove(r);
    return { ok: true };
  }

  // Ajusta el saldo de una cuenta sumando delta (negativo para restar). Aritmética en numeric.
  private async ajustarSaldo(manager: EntityManager, usuarioId: number, cuentaId: number, delta: number) {
    if (!cuentaId || !delta) return;
    await manager.createQueryBuilder()
      .update(Cuenta)
      .set({ saldo: () => 'saldo + :delta' })
      .where('id = :cuentaId AND usuario_id = :usuarioId', { cuentaId, usuarioId })
      .setParameter('delta', delta)
      .execute();
  }

  async confirmar(usuarioId: number, recurrenteId: number, mes: string, monto: number) {
    const rec = await this.recurrentes.findOne({ where: { id: recurrenteId, usuarioId } });
    if (!rec) throw new NotFoundException();

    // Calcular Δ% respecto al mes anterior confirmado
    const anterior = await this.cargos
      .createQueryBuilder('c')
      .where('c.recurrente_id = :id', { id: recurrenteId })
      .andWhere('c.estado = :e', { e: 'confirmado' })
      .andWhere('c.mes < :mes', { mes })
      .andWhere('c.monto IS NOT NULL')
      .orderBy('c.mes', 'DESC')
      .getOne();

    const delta = anterior?.monto
      ? ((monto - parseFloat(anterior.monto)) / parseFloat(anterior.monto)) * 100
      : null;

    // Confirmar es un gasto real: crea el movimiento y baja el saldo de la cuenta, en transacción.
    return this.dataSource.transaction(async (manager) => {
      let cargo = await manager.findOne(CargoRecurrente, { where: { recurrenteId, mes } });
      if (!cargo) cargo = manager.create(CargoRecurrente, { recurrenteId, mes, estado: 'por-confirmar' });

      const fechaNum = `${mes}-${String(rec.diaAprox).padStart(2, '0')}`;
      const mov = await manager.save(
        manager.create(Movimiento, {
          usuarioId,
          fecha: fechaNum,
          monto: String(monto),
          tipo: 'gasto',
          descripcion: rec.nombre,
          categoriaId: rec.categoriaId,
          cuentaId: rec.cuentaId,
          recurrenteId: rec.id,
        }),
      );
      await this.ajustarSaldo(manager, usuarioId, rec.cuentaId, -monto);

      cargo.monto = String(monto);
      cargo.estado = 'confirmado';
      cargo.movimientoId = mov.id;
      await manager.save(cargo);

      await manager.update(Recurrente, rec.id, { montoEstimado: String(monto) });

      return { cargo, movimiento: mov, delta: delta !== null ? Math.round(delta * 10) / 10 : null };
    });
  }

  // Des-confirmar: borra el gasto generado, devuelve el monto al saldo y vuelve el cargo a por-confirmar.
  async desconfirmar(usuarioId: number, recurrenteId: number, mes: string) {
    const rec = await this.recurrentes.findOne({ where: { id: recurrenteId, usuarioId } });
    if (!rec) throw new NotFoundException();

    return this.dataSource.transaction(async (manager) => {
      const cargo = await manager.findOne(CargoRecurrente, { where: { recurrenteId, mes } });
      if (!cargo || cargo.estado !== 'confirmado') {
        throw new BadRequestException('Este cargo no está confirmado');
      }
      if (cargo.movimientoId) {
        const mov = await manager.findOne(Movimiento, { where: { id: cargo.movimientoId, usuarioId } });
        if (mov) {
          // Era un gasto: al borrarlo, devolver el monto al saldo de la cuenta.
          await this.ajustarSaldo(manager, usuarioId, mov.cuentaId, parseFloat(mov.monto));
          await manager.remove(mov);
        }
      }
      cargo.estado = 'por-confirmar';
      cargo.monto = null;
      cargo.movimientoId = null;
      await manager.save(cargo);
      return { ok: true };
    });
  }

  // Cron: día 1 de cada mes a las 00:05 ART — genera cargos por-confirmar
  @Cron('5 0 1 * *', { timeZone: 'America/Argentina/Buenos_Aires' })
  async generarCargos() {
    const ahora = new Date();
    const mes = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}`;
    this.logger.log(`Generando cargos recurrentes para ${mes}`);

    const todos = await this.recurrentes.find();
    for (const rec of todos) {
      // Idempotente: UNIQUE (recurrenteId, mes) lo previene en BD, pero verificamos antes
      const existe = await this.cargos.findOne({ where: { recurrenteId: rec.id, mes } });
      if (!existe) {
        await this.cargos.save(
          this.cargos.create({ recurrenteId: rec.id, mes, estado: 'por-confirmar' }),
        );
      }
    }
    this.logger.log(`Cargos generados para ${mes}`);
  }

  async generarManual(mes: string) {
    await this.generarCargosParaMes(mes);
    return { ok: true, mes };
  }

  private async generarCargosParaMes(mes: string) {
    const todos = await this.recurrentes.find();
    for (const rec of todos) {
      const existe = await this.cargos.findOne({ where: { recurrenteId: rec.id, mes } });
      if (!existe) {
        await this.cargos.save(
          this.cargos.create({ recurrenteId: rec.id, mes, estado: 'por-confirmar' }),
        );
      }
    }
  }
}
