import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { DolarController } from './dolar.controller';
import { DolarService } from './dolar.service';
import { CotizacionDolar } from '../../entities/cotizacion-dolar.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CotizacionDolar])],
  controllers: [DolarController],
  providers: [DolarService],
  exports: [DolarService],
})
export class DolarModule {}
