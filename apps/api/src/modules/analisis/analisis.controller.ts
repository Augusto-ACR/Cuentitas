import { Controller, Get, Query } from '@nestjs/common';
import { AnalisisService } from './analisis.service';
import { UsuarioId } from '../../common/decorators';

@Controller('analisis')
export class AnalisisController {
  constructor(private readonly svc: AnalisisService) {}

  @Get('tendencia')
  tendencia(@UsuarioId() uid: number) { return this.svc.tendencia(uid); }

  @Get('categorias')
  categorias(@UsuarioId() uid: number, @Query('mes') mes: string) {
    return this.svc.porCategoria(uid, mes);
  }

  @Get('top-descripciones')
  top(@UsuarioId() uid: number, @Query('mes') mes: string) {
    return this.svc.topDescripciones(uid, mes);
  }
}
