import { Controller, Get, Post, Patch, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CuentasService } from './cuentas.service';
import { UsuarioId } from '../../common/decorators';

@Controller()
export class CuentasController {
  constructor(private readonly svc: CuentasService) {}

  @Get('cuentas')
  getCuentas(@UsuarioId() id: number) { return this.svc.getCuentas(id); }

  @Post('cuentas')
  crearCuenta(@UsuarioId() id: number, @Body() body: any) { return this.svc.crearCuenta(id, body); }

  @Patch('cuentas/:id')
  patchCuenta(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.patchCuenta(uid, id, body);
  }

  @Get('buckets')
  getBuckets(@UsuarioId() id: number) { return this.svc.getBuckets(id); }

  @Post('buckets')
  crearBucket(@UsuarioId() id: number, @Body() body: any) { return this.svc.crearBucket(id, body); }

  @Patch('buckets/:id')
  patchBucket(@UsuarioId() uid: number, @Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.patchBucket(uid, id, body);
  }
}
