import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import {
  IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, IsInt, IsIn, Matches,
} from 'class-validator';
import { BotAccionesService } from './bot-acciones.service';
import { SkipAuth } from '../../common/decorators';
import { BotKeyGuard } from '../../common/bot-key.guard';

class TelefonoDto {
  @IsString() @IsNotEmpty() telefono: string;
}

class ResumenDto {
  @IsString() @IsNotEmpty() telefono: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}$/, { message: 'mes debe ser YYYY-MM' }) mes?: string;
}

class MovimientoDto {
  @IsString() @IsNotEmpty() telefono: string;
  @IsIn(['ingreso', 'gasto']) tipo: 'ingreso' | 'gasto';
  @IsNumber() @IsPositive() monto: number;
  @IsString() @IsNotEmpty() descripcion: string;
  @IsOptional() @IsInt() cuentaId?: number;
  @IsOptional() @IsString() cuenta?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'fecha debe ser YYYY-MM-DD' }) fecha?: string;
}

/**
 * Acciones del bot (superficie solo-bot, X-Bot-Key). Cada request trae el `telefono`;
 * la API resuelve teléfono→usuario y hace el scoping. Todo POST para no exponer el
 * teléfono en URLs/logs.
 */
@SkipAuth()
@UseGuards(BotKeyGuard)
@Controller('bot')
export class BotAccionesController {
  constructor(private readonly svc: BotAccionesService) {}

  @Post('saldos')
  @HttpCode(200)
  saldos(@Body() dto: TelefonoDto) {
    return this.svc.saldos(dto.telefono);
  }

  @Post('resumen')
  @HttpCode(200)
  resumen(@Body() dto: ResumenDto) {
    return this.svc.resumen(dto.telefono, dto.mes);
  }

  @Post('movimiento')
  @HttpCode(200)
  movimiento(@Body() dto: MovimientoDto) {
    return this.svc.registrarMovimiento(dto.telefono, dto);
  }
}
