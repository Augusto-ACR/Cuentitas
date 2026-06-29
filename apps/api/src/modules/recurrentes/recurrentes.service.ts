import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Recurrente } from '../../entities/recurrente.entity';
import { CargoRecurrente } from '../../entities/cargo-recurrente.entity';
import { Movimiento } from '../../entities/movimiento.entity';

@Injectable()
export class RecurrentesService {
  private readonly logger = new Logger(RecurrentesService.name);

  constructor(
    @InjectRepository(Recurrente) private readonly recurrentes: Repository<Recurrente>,
    @InjectRepository(CargoRecurrente) private readonly cargos: Repository<CargoRecurrente>,
    @InjectRepository(Movimiento) private readonly movimientos: Repository<Movimiento>,
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

  async confirmar(usuarioId: number, recurrenteId: number, mes: string, monto: number) {
    const rec = await this.recurrentes.findOne({ where: { id: recurrenteId, usuarioId } });
    if (!rec) throw new NotFoundException();

    let cargo = await this.cargos.findOne({ where: { recurrenteId, mes } });
    if (!cargo) {
      cargo = this.cargos.create({ recurrenteId, mes, estado: 'por-confirmar' });
    }

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

    // Crear movimiento scopeado al usuario
    const fechaNum = `${mes}-${String(rec.diaAprox).padStart(2, '0')}`;
    const mov = await this.movimientos.save(
      this.movimientos.create({
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

    cargo.monto = String(monto);
    cargo.estado = 'confirmado';
    cargo.movimientoId = mov.id;
    await this.cargos.save(cargo);

    // Actualizar estimado para el próximo mes
    await this.recurrentes.update(rec.id, { montoEstimado: String(monto) });

    return { cargo, movimiento: mov, delta: delta !== null ? Math.round(delta * 10) / 10 : null };
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
