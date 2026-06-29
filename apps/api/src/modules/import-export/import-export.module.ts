import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImportExportController } from './import-export.controller';
import { ImportExportService } from './import-export.service';
import { Movimiento } from '../../entities/movimiento.entity';
import { Cuenta } from '../../entities/cuenta.entity';
import { CategoriasModule } from '../categorias/categorias.module';

@Module({
  imports: [TypeOrmModule.forFeature([Movimiento, Cuenta]), CategoriasModule],
  controllers: [ImportExportController],
  providers: [ImportExportService],
})
export class ImportExportModule {}
