import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Or } from 'typeorm';
import { Categoria } from '../../entities/categoria.entity';

@Injectable()
export class CategoriasService {
  constructor(
    @InjectRepository(Categoria) private readonly repo: Repository<Categoria>,
  ) {}

  // Devuelve base globales + propias del usuario
  listar(usuarioId: number) {
    return this.repo.find({
      where: [
        { sistema: true, usuarioId: IsNull() },
        { sistema: false, usuarioId },
      ],
      order: { sistema: 'DESC', label: 'ASC' },
    });
  }

  async crear(usuarioId: number, data: { slug: string; color: string; label: string; matches?: string[] }) {
    const cat = this.repo.create({ ...data, usuarioId, sistema: false, matches: data.matches ?? [] });
    return this.repo.save(cat);
  }

  async actualizar(usuarioId: number, id: number, data: Partial<{ color: string; label: string; matches: string[] }>) {
    const cat = await this.findOwn(usuarioId, id);
    Object.assign(cat, data);
    return this.repo.save(cat);
  }

  async eliminar(usuarioId: number, id: number) {
    const cat = await this.findOwn(usuarioId, id);
    await this.repo.remove(cat);
    return { ok: true };
  }

  private async findOwn(usuarioId: number, id: number) {
    const cat = await this.repo.findOne({ where: { id } });
    if (!cat) throw new NotFoundException();
    if (cat.sistema || cat.usuarioId !== usuarioId) throw new ForbiddenException();
    return cat;
  }

  // Para autocategorización en importador
  async findMatching(usuarioId: number, descripcion: string): Promise<number | null> {
    const cats = await this.listar(usuarioId);
    const desc = descripcion.toLowerCase();
    for (const c of cats) {
      if (c.matches?.some(m => desc.includes(m.toLowerCase()))) return c.id;
    }
    return null;
  }
}
