import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MovimientosController } from './movimientos.controller';
import { MovimientosService } from './movimientos.service';
import { Movimiento } from '../../entities/movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento])],
  controllers: [MovimientosController],
  providers: [MovimientosService],
  exports: [MovimientosService],
})
export class MovimientosModule {}
