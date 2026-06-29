import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { SKIP_AUTH, ADMIN_ONLY } from './scoping.guard';

export const SkipAuth = () => SetMetadata(SKIP_AUTH, true);
export const AdminOnly = () => SetMetadata(ADMIN_ONLY, true);

// Extrae usuarioId inyectado por ScopingGuard
export const UsuarioId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => {
    const req = ctx.switchToHttp().getRequest();
    return req.usuarioId;
  },
);

export const UsuarioRol = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().usuarioRol;
  },
);
