import { Controller, Get, Query } from '@nestjs/common';
import { DolarService } from './dolar.service';
import { TipoDolar } from '../../entities/cotizacion-dolar.entity';

@Controller('dolar')
export class DolarController {
  constructor(private readonly svc: DolarService) {}

  @Get()
  ultimas() {
    return this.svc.ultimas();
  }

  @Get('historial')
  historial(@Query('tipo') tipo: TipoDolar = 'blue') {
    return this.svc.historial(tipo);
  }
}
