import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Cuenta } from '../../entities/cuenta.entity';
import { Movimiento } from '../../entities/movimiento.entity';
import { Recurrente } from '../../entities/recurrente.entity';
import { AporteMeta } from '../../entities/aporte-meta.entity';

@Injectable()
export class CuentasService {
  constructor(
    @InjectRepository(Cuenta) private readonly cuentas: Repository<Cuenta>,
    private readonly dataSource: DataSource,
  ) {}

  getCuentas(usuarioId: number) {
    return this.cuentas.find({ where: { usuarioId }, order: { nombre: 'ASC' } });
  }

  async patchCuenta(usuarioId: number, id: number, data: Partial<{ nombre: string; saldo: string; icono: string }>) {
    const c = await this.cuentas.findOne({ where: { id, usuarioId } });
    if (!c) throw new NotFoundException();
    Object.assign(c, data);
    return this.cuentas.save(c);
  }

  async crearCuenta(usuarioId: number, data: { nombre: string; saldo?: string; icono?: string; moneda?: string }) {
    const moneda = data.moneda === 'USD' ? 'USD' : 'ARS';
    return this.cuentas.save(this.cuentas.create({ usuarioId, saldo: '0', icono: 'wallet', ...data, moneda }));
  }

  // No se puede eliminar una cuenta con movimientos o gastos fijos asociados (rompería el historial).
  async eliminarCuenta(usuarioId: number, id: number) {
    const c = await this.cuentas.findOne({ where: { id, usuarioId } });
    if (!c) throw new NotFoundException();
    return this.dataSource.transaction(async (manager) => {
      const movs = await manager.count(Movimiento, { where: { cuentaId: id, usuarioId } });
      if (movs > 0) {
        throw new BadRequestException('Esta cuenta tiene movimientos. Borralos o reasignalos antes de eliminarla.');
      }
      const recs = await manager.count(Recurrente, { where: { cuentaId: id, usuarioId } });
      if (recs > 0) {
        throw new BadRequestException('Esta cuenta está usada por un gasto fijo. Cambiale la cuenta a ese gasto fijo primero.');
      }
      // Los aportes guardan la cuenta de origen solo como referencia: la desvinculamos.
      await manager.update(AporteMeta, { cuentaId: id, usuarioId }, { cuentaId: null });
      await manager.remove(Cuenta, c);
      return { ok: true };
    });
  }
}
