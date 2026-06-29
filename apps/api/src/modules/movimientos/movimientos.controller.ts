import { Controller, Get, Post, Patch, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { MovimientosService } from './movimientos.service';
import { UsuarioId } from '../../common/decorators';

@Controller('movimientos')
export class MovimientosController {
  constructor(private readonly svc: MovimientosService) {}

  @Get()
  listar(
    @UsuarioId() uid: number,
    @Query('mes') mes?: string,
    @Query('tipo') tipo?: 'ingreso' | 'gasto',
    @Query('categoriaId') categoriaId?: string,
    @Query('cuentaId') cuentaId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
  ) {
    return this.svc.listar(uid, {
      mes, tipo,
      categoriaId: categoriaId ? +categoriaId : undefined,
      cuentaId: cuentaId ? +cuentaId : undefined,
      q, page: page ? +page : 1,
    });
  }

  @Get('resumen')
  resumen(@UsuarioId() uid: number, @Query('mes') mes: string) {
    return this.svc.resumen(uid, mes);
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
}
