import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetasController } from './metas.controller';
import { MetasService } from './metas.service';
import { Meta } from '../../entities/meta.entity';
import { MetaParticipante } from '../../entities/meta-participante.entity';
import { AporteMeta } from '../../entities/aporte-meta.entity';
import { DolarModule } from '../dolar/dolar.module';

@Module({
  imports: [TypeOrmModule.forFeature([Meta, MetaParticipante, AporteMeta]), DolarModule],
  controllers: [MetasController],
  providers: [MetasService],
})
export class MetasModule {}
