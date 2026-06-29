import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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

  // Cambio de contraseña self-service: requiere la contraseña actual.
  async cambiarPassword(usuarioId: number, actual: string, nueva: string) {
    const u = await this.usuarios.findOne({ where: { id: usuarioId } });
    if (!u) throw new UnauthorizedException();
    const ok = await bcrypt.compare(actual ?? '', u.passwordHash);
    if (!ok) throw new BadRequestException('La contraseña actual no es correcta');
    if (!nueva || nueva.length < 6) throw new BadRequestException('La nueva contraseña debe tener al menos 6 caracteres');
    u.passwordHash = await bcrypt.hash(nueva, 12);
    await this.usuarios.save(u);
    return { ok: true };
  }

  private sanitize(u: Usuario) {
    const { passwordHash, ...rest } = u as any;
    return rest;
  }
}
