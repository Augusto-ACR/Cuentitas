import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario) private readonly repo: Repository<Usuario>,
  ) {}

  // Lista mínima de toda la familia (incluido el admin) para elegir participantes
  // de una meta compartida. No expone datos sensibles ni financieros.
  async familia() {
    return this.repo.find({
      select: ['id', 'nombre', 'username'],
      order: { nombre: 'ASC' },
    });
  }

  // Solo admin: listado completo de accesos (sin datos financieros)
  async listar() {
    return this.repo.find({ select: ['id', 'username', 'nombre', 'rol', 'createdAt'] });
  }

  async crear(data: { username: string; nombre: string; password: string; rol?: 'admin' | 'miembro' }) {
    const existe = await this.repo.findOne({ where: { username: data.username } });
    if (existe) throw new ConflictException('El usuario ya existe');
    const passwordHash = await bcrypt.hash(data.password, 12);
    const u = this.repo.create({ ...data, passwordHash, rol: data.rol ?? 'miembro' });
    const saved = await this.repo.save(u);
    const { passwordHash: _, ...rest } = saved as any;
    return rest;
  }

  async actualizar(id: number, data: Partial<{ nombre: string; dolarPref: string }>) {
    await this.repo.update(id, data as any);
    return this.repo.findOne({ where: { id }, select: ['id', 'username', 'nombre', 'rol', 'dolarPref'] });
  }

  async eliminar(id: number) {
    const u = await this.repo.findOne({ where: { id } });
    if (!u) throw new NotFoundException();
    await this.repo.remove(u);
    return { ok: true };
  }

  async resetPassword(id: number, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await this.repo.update(id, { passwordHash });
    return { ok: true };
  }

  async actualizarPreferencias(id: number, dolarPref: string) {
    await this.repo.update(id, { dolarPref: dolarPref as any });
    return { ok: true };
  }
}
