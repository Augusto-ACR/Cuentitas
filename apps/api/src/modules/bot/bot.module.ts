import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BotController } from './bot.controller';
import { BotVinculacionController } from './bot-vinculacion.controller';
import { BotAccionesController } from './bot-acciones.controller';
import { BotService } from './bot.service';
import { BotAccionesService } from './bot-acciones.service';
import { BotVinculacion } from '../../entities/bot-vinculacion.entity';
import { Usuario } from '../../entities/usuario.entity';
import { Cuenta } from '../../entities/cuenta.entity';
import { CuentasModule } from '../cuentas/cuentas.module';
import { MovimientosModule } from '../movimientos/movimientos.module';
import { CategoriasModule } from '../categorias/categorias.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BotVinculacion, Usuario, Cuenta]),
    CuentasModule,
    MovimientosModule,
    CategoriasModule,
  ],
  controllers: [BotController, BotVinculacionController, BotAccionesController],
  providers: [BotService, BotAccionesService],
  exports: [BotService],
})
export class BotModule {}
