import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecurrentesController } from './recurrentes.controller';
import { RecurrentesService } from './recurrentes.service';
import { Recurrente } from '../../entities/recurrente.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recurrente])],
  controllers: [RecurrentesController],
  providers: [RecurrentesService],
  exports: [RecurrentesService],
})
export class RecurrentesModule {}
