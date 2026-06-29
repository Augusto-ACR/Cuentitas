import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { RecurrentesService } from './recurrentes.service';
import { UsuarioId } from '../../common/decorators';

@Controller('recurrentes')
export class RecurrentesController {
  constructor(private readonly svc: RecurrentesService) {}

  @Get()
  listar(@UsuarioId() uid: number, @Query('mes') mes?: string) {
    return this.svc.listar(uid, mes);
  }

  @Post()
  crear(@UsuarioId() uid: number, @Body() body: any) {
    return this.svc.crear(uid, body);
  }

  @Patch(':id')
  actualizar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.actualizar(uid, id, body);
  }

  @Delete(':id')
  eliminar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.eliminar(uid, id);
  }

  @Post(':id/confirmar')
  confirmar(
    @UsuarioId() uid: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { mes: string; monto: number },
  ) {
    return this.svc.confirmar(uid, id, body.mes, body.monto);
  }

  @Post('generar')
  generar(@Query('mes') mes: string) {
    return this.svc.generarManual(mes);
  }
}
