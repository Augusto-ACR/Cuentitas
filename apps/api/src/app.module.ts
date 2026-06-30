import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';

import { ScopingGuard } from './common/scoping.guard';

import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { CuentasModule } from './modules/cuentas/cuentas.module';
import { MovimientosModule } from './modules/movimientos/movimientos.module';
import { RecurrentesModule } from './modules/recurrentes/recurrentes.module';
import { MetasModule } from './modules/metas/metas.module';
import { DolarModule } from './modules/dolar/dolar.module';
import { AnalisisModule } from './modules/analisis/analisis.module';
import { ImportExportModule } from './modules/import-export/import-export.module';
import { BotModule } from './modules/bot/bot.module';
import { HealthController } from './modules/health/health.controller';

import { Usuario } from './entities/usuario.entity';
import { Categoria } from './entities/categoria.entity';
import { Cuenta } from './entities/cuenta.entity';
import { Movimiento } from './entities/movimiento.entity';
import { Recurrente } from './entities/recurrente.entity';
import { Meta } from './entities/meta.entity';
import { MetaParticipante } from './entities/meta-participante.entity';
import { AporteMeta } from './entities/aporte-meta.entity';
import { CotizacionDolar } from './entities/cotizacion-dolar.entity';
import { BotVinculacion } from './entities/bot-vinculacion.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      entities: [
        Usuario, Categoria, Cuenta, Movimiento,
        Recurrente, Meta, MetaParticipante,
        AporteMeta, CotizacionDolar, BotVinculacion,
      ],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: false,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-me',
      signOptions: { expiresIn: '7d' },
      global: true,
    }),
    AuthModule,
    UsuariosModule,
    CategoriasModule,
    CuentasModule,
    MovimientosModule,
    RecurrentesModule,
    MetasModule,
    DolarModule,
    AnalisisModule,
    ImportExportModule,
    BotModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ScopingGuard,
    },
  ],
})
export class AppModule {}
