import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
    private readonly jwt: JwtService,
  ) {}

  async login(username: string, password: string) {
    const usuario = await this.usuarios.findOne({ where: { username } });
    if (!usuario) throw new UnauthorizedException('Credenciales inválidas');

    const ok = await bcrypt.compare(password, usuario.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const token = this.jwt.sign({ sub: usuario.id, rol: usuario.rol });
    return { token, usuario: this.sanitize(usuario) };
  }

  async me(usuarioId: number) {
    const u = await this.usuarios.findOne({ where: { id: usuarioId } });
    if (!u) throw new UnauthorizedException();
    return this.sanitize(u);
  }

  private sanitize(u: Usuario) {
    const { passwordHash, ...rest } = u as any;
    return rest;
  }
}
