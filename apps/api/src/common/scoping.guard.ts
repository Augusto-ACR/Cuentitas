import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

export const SKIP_AUTH = 'skipAuth';
export const ADMIN_ONLY = 'adminOnly';

// El guard extrae usuarioId del JWT y lo inyecta en request.
// TODAS las rutas privadas pasan por acá: es el único lugar donde
// se establece la identidad del usuario para las queries de scoping.
@Injectable()
export class ScopingGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(ctx: ExecutionContext): boolean {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_AUTH, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (skip) return true;

    const req = ctx.switchToHttp().getRequest<Request & { usuarioId: number; usuarioRol: string }>();
    const token = req.cookies?.token;
    if (!token) throw new UnauthorizedException('No autenticado');

    try {
      const payload = this.jwtService.verify(token);
      req.usuarioId = payload.sub;
      req.usuarioRol = payload.rol;
    } catch {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    const adminOnly = this.reflector.getAllAndOverride<boolean>(ADMIN_ONLY, [
      ctx.getHandler(), ctx.getClass(),
    ]);
    if (adminOnly) {
      const req2 = ctx.switchToHttp().getRequest<any>();
      if (req2.usuarioRol !== 'admin') throw new UnauthorizedException('Solo administradores');
    }

    return true;
  }
}
