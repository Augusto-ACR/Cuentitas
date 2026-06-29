import { Controller, Get, Post, Patch, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { MetasService } from './metas.service';
import { UsuarioId } from '../../common/decorators';

@Controller('metas')
export class MetasController {
  constructor(private readonly svc: MetasService) {}

  @Get()
  listar(@UsuarioId() uid: number) { return this.svc.listar(uid); }

  // Importante: ruta estática antes de la paramétrica @Get(':id') para que no la capture.
  @Get('total-ahorrado')
  totalAhorrado(@UsuarioId() uid: number) { return this.svc.totalAhorrado(uid); }

  @Post()
  crear(@UsuarioId() uid: number, @Body() body: any) { return this.svc.crear(uid, body); }

  @Get(':id')
  detalle(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.getDetalle(uid, id);
  }

  @Patch(':id')
  actualizar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.actualizar(uid, id, body);
  }

  @Delete(':id')
  eliminar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number, @Body() body: { cuentaId?: number } = {}) {
    return this.svc.eliminar(uid, id, body?.cuentaId);
  }

  @Post(':id/participantes')
  agregarParticipante(
    @UsuarioId() uid: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { usuarioId: number },
  ) {
    return this.svc.agregarParticipante(uid, id, body.usuarioId);
  }

  @Delete(':id/participantes/:uid')
  quitarParticipante(
    @UsuarioId() uid: number,
    @Param('id', ParseIntPipe) id: number,
    @Param('uid', ParseIntPipe) quitarId: number,
  ) {
    return this.svc.quitarParticipante(uid, id, quitarId);
  }

  @Post(':id/aportes')
  agregarAporte(
    @UsuarioId() uid: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { montoARS: number; fecha: string; cuentaId: number; moneda?: string },
  ) {
    return this.svc.agregarAporte(uid, id, body.montoARS, body.fecha, body.cuentaId, body.moneda);
  }

  @Post(':id/retiros')
  retirar(
    @UsuarioId() uid: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { montoARS: number; fecha: string; cuentaId: number; moneda?: string },
  ) {
    return this.svc.retirar(uid, id, body.montoARS, body.fecha, body.cuentaId, body.moneda);
  }

  @Post(':id/completar')
  completar(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number) {
    return this.svc.completar(uid, id);
  }
}
