import {
  Controller, Post, Get, Body, UseGuards, HttpCode,
} from '@nestjs/common';
import { IsString, IsNotEmpty } from 'class-validator';
import { BotService } from './bot.service';
import { SkipAuth } from '../../common/decorators';
import { BotKeyGuard } from '../../common/bot-key.guard';

class VincularDto {
  @IsString() @IsNotEmpty() telefono: string;
  @IsString() @IsNotEmpty() codigo: string;
}

class ResolverDto {
  @IsString() @IsNotEmpty() telefono: string;
}

/**
 * Superficie SOLO-BOT. Autenticada con `X-Bot-Key` (BotKeyGuard), no con JWT.
 * @SkipAuth() saltea el ScopingGuard global; la identidad del usuario se resuelve
 * acá a partir del teléfono.
 */
@SkipAuth()
@UseGuards(BotKeyGuard)
@Controller('bot')
export class BotController {
  constructor(private readonly svc: BotService) {}

  // Prueba de vida + validación de la clave.
  @Get('ping')
  ping() {
    return { ok: true, surface: 'bot' };
  }

  @Post('vincular')
  @HttpCode(200)
  vincular(@Body() dto: VincularDto) {
    return this.svc.vincular(dto.telefono, dto.codigo);
  }

  @Post('resolver')
  @HttpCode(200)
  resolver(@Body() dto: ResolverDto) {
    return this.svc.resolver(dto.telefono);
  }
}
