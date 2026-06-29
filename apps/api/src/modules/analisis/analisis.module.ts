import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalisisController } from './analisis.controller';
import { AnalisisService } from './analisis.service';
import { Movimiento } from '../../entities/movimiento.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento])],
  controllers: [AnalisisController],
  providers: [AnalisisService],
})
export class AnalisisModule {}
