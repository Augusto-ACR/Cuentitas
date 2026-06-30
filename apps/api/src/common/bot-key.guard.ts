import {
  Injectable, CanActivate, ExecutionContext, UnauthorizedException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Request } from 'express';
import { timingSafeEqual } from 'crypto';

/**
 * Guard de la superficie solo-bot. Valida el header `X-Bot-Key` contra `BOT_API_KEY`.
 *
 * Las rutas del bot llevan además @SkipAuth() para saltarse el ScopingGuard global
 * (que espera un JWT de usuario): el bot no tiene JWT, se autentica con esta clave única
 * y luego la API resuelve teléfono→usuario.
 */
@Injectable()
export class BotKeyGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const expected = process.env.BOT_API_KEY;
    // Sin clave configurada la superficie del bot queda cerrada (no abierta).
    if (!expected) {
      throw new ServiceUnavailableException('Bot no configurado');
    }

    const req = ctx.switchToHttp().getRequest<Request>();
    const raw = req.headers['x-bot-key'];
    const provided = Array.isArray(raw) ? raw[0] : raw;
    if (!provided || !this.safeEqual(provided, expected)) {
      throw new UnauthorizedException('Clave de bot inválida');
    }
    return true;
  }

  // Comparación en tiempo constante para no filtrar la clave por timing.
  private safeEqual(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}
