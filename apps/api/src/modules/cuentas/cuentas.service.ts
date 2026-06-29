import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuenta } from '../../entities/cuenta.entity';

@Injectable()
export class CuentasService {
  constructor(
    @InjectRepository(Cuenta) private readonly cuentas: Repository<Cuenta>,
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

  async crearCuenta(usuarioId: number, data: { nombre: string; saldo?: string; icono?: string }) {
    return this.cuentas.save(this.cuentas.create({ usuarioId, saldo: '0', icono: 'wallet', ...data }));
  }
}
