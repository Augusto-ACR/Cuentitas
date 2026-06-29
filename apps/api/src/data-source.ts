import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Usuario } from './entities/usuario.entity';
import { Categoria } from './entities/categoria.entity';
import { Cuenta } from './entities/cuenta.entity';
import { Movimiento } from './entities/movimiento.entity';
import { Recurrente } from './entities/recurrente.entity';
import { Meta } from './entities/meta.entity';
import { MetaParticipante } from './entities/meta-participante.entity';
import { AporteMeta } from './entities/aporte-meta.entity';
import { CotizacionDolar } from './entities/cotizacion-dolar.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    Usuario, Categoria, Cuenta, Movimiento,
    Recurrente, Meta, MetaParticipante,
    AporteMeta, CotizacionDolar,
  ],
  migrations: ['dist/migrations/*.js'],
  synchronize: false,
  logging: false,
});
