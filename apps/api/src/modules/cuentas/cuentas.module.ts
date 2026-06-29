import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CuentasController } from './cuentas.controller';
import { CuentasService } from './cuentas.service';
import { Cuenta } from '../../entities/cuenta.entity';
import { Bucket } from '../../entities/bucket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Cuenta, Bucket])],
  controllers: [CuentasController],
  providers: [CuentasService],
  exports: [CuentasService],
})
export class CuentasModule {}
