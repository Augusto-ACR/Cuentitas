import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurrentesController } from './recurrentes.controller';
import { RecurrentesService } from './recurrentes.service';
import { Recurrente } from '../../entities/recurrente.entity';
import { CargoRecurrente } from '../../entities/cargo-recurrente.entity';
import { Movimiento } from '../../entities/movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recurrente, CargoRecurrente, Movimiento])],
  controllers: [RecurrentesController],
  providers: [RecurrentesService],
  exports: [RecurrentesService],
})
export class RecurrentesModule {}
