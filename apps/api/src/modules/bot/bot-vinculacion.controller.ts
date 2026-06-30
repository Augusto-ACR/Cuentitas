import { Controller, Post, Get, Delete, HttpCode } from '@nestjs/common';
import { BotService } from './bot.service';
import { UsuarioId } from '../../common/decorators';

/**
 * Lado USUARIO de la vinculación con el bot. Pasa por el ScopingGuard global
 * (requiere estar logueado): el usuario genera su código y ve/borra su vínculo.
 */
@Controller('vinculacion-bot')
export class BotVinculacionController {
  constructor(private readonly svc: BotService) {}

  // Estado actual del vínculo (para mostrar en Ajustes).
  @Get()
  estado(@UsuarioId() usuarioId: number) {
    return this.svc.estado(usuarioId);
  }

  // Genera (o regenera) el código de un solo uso para dictarle al bot.
  @Post('codigo')
  @HttpCode(200)
  generarCodigo(@UsuarioId() usuarioId: number) {
    return this.svc.generarCodigo(usuarioId);
  }

  // Desvincula el teléfono de la cuenta.
  @Delete()
  @HttpCode(200)
  desvincular(@UsuarioId() usuarioId: number) {
    return this.svc.desvincular(usuarioId);
  }
}
