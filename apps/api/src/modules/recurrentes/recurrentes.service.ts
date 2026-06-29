import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Recurrente } from '../../entities/recurrente.entity';
import { Movimiento } from '../../entities/movimiento.entity';
import { Cuenta } from '../../entities/cuenta.entity';

// Recurrentes = plantillas de gastos que se repiten. "Cargar" una plantilla crea
// un movimiento normal del mes (que mueve el saldo, se edita y se borra como cualquiera).
@Injectable()
export class RecurrentesService {
  constructor(
    @InjectRepository(Recurrente) private readonly recurrentes: Repository<Recurrente>,
    private readonly dataSource: DataSource,
  ) {}

  listar(usuarioId: number) {
    return this.recurrentes.find({
      where: { usuarioId },
      relations: ['categoria', 'cuenta'],
      order: { nombre: 'ASC' },
    });
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
    return this.dataSource.transaction(async (manager) => {
      // Desvincular los movimientos que apuntan a esta plantilla: quedan como
      // gastos sueltos (no se borran) para no romper la FK ni perder historial.
      await manager.update(Movimiento, { recurrenteId: id, usuarioId }, { recurrenteId: null });
      await manager.delete(Recurrente, { id, usuarioId });
      return { ok: true };
    });
  }

  // Carga la plantilla como un gasto del mes: crea el movimiento y baja el saldo,
  // todo en una transacción. Devuelve el movimiento creado.
  async cargar(usuarioId: number, id: number, monto?: number, fecha?: string) {
    const rec = await this.recurrentes.findOne({ where: { id, usuarioId } });
    if (!rec) throw new NotFoundException();
    const montoFinal = monto != null ? monto : parseFloat(rec.montoEstimado);
    const fechaFinal = fecha ?? new Date().toISOString().split('T')[0];

    return this.dataSource.transaction(async (manager) => {
      const mov = await manager.save(
        manager.create(Movimiento, {
          usuarioId,
          fecha: fechaFinal,
          monto: String(montoFinal),
          tipo: 'gasto',
          descripcion: rec.nombre,
          categoriaId: rec.categoriaId,
          cuentaId: rec.cuentaId,
          recurrenteId: rec.id,
        }),
      );
      await manager.createQueryBuilder()
        .update(Cuenta)
        .set({ saldo: () => 'saldo - :monto' })
        .where('id = :cuentaId AND usuario_id = :usuarioId', { cuentaId: rec.cuentaId, usuarioId })
        .setParameter('monto', montoFinal)
        .execute();
      // Recordar el último monto en la plantilla para la próxima vez.
      await manager.update(Recurrente, rec.id, { montoEstimado: String(montoFinal) });
      return mov;
    });
  }
}
