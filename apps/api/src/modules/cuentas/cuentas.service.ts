import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuenta } from '../../entities/cuenta.entity';
import { Bucket } from '../../entities/bucket.entity';

@Injectable()
export class CuentasService {
  constructor(
    @InjectRepository(Cuenta) private readonly cuentas: Repository<Cuenta>,
    @InjectRepository(Bucket) private readonly buckets: Repository<Bucket>,
  ) {}

  getCuentas(usuarioId: number) {
    return this.cuentas.find({ where: { usuarioId }, order: { nombre: 'ASC' } });
  }

  getBuckets(usuarioId: number) {
    return this.buckets.find({ where: { usuarioId }, order: { nombre: 'ASC' } });
  }

  async patchCuenta(usuarioId: number, id: number, data: Partial<{ nombre: string; saldo: string; icono: string }>) {
    const c = await this.cuentas.findOne({ where: { id, usuarioId } });
    if (!c) throw new NotFoundException();
    Object.assign(c, data);
    return this.cuentas.save(c);
  }

  async patchBucket(usuarioId: number, id: number, data: Partial<{ nombre: string; monto: string }>) {
    const b = await this.buckets.findOne({ where: { id, usuarioId } });
    if (!b) throw new NotFoundException();
    Object.assign(b, data);
    return this.buckets.save(b);
  }

  async crearCuenta(usuarioId: number, data: { nombre: string; saldo?: string; icono?: string }) {
    return this.cuentas.save(this.cuentas.create({ usuarioId, saldo: '0', icono: 'wallet', ...data }));
  }

  async crearBucket(usuarioId: number, data: { nombre: string; monto?: string }) {
    return this.buckets.save(this.buckets.create({ usuarioId, monto: '0', ...data }));
  }
}
