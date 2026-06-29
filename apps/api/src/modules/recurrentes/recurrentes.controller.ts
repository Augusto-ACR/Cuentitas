import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { RecurrentesService } from './recurrentes.service';
import { UsuarioId } from '../../common/decorators';

@Controller('recurrentes')
export class RecurrentesController {
  constructor(private readonly svc: RecurrentesService) {}

  @Get()
  listar(@UsuarioId() uid: number) {
    return this.svc.listar(uid);
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

  @Post(':id/cargar')
  cargar(
    @UsuarioId() uid: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { monto?: number; fecha?: string },
  ) {
    return this.svc.cargar(uid, id, body?.monto, body?.fecha);
  }
}
