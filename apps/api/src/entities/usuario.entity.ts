import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Movimiento } from './movimiento.entity';
import { Cuenta } from './cuenta.entity';
import { Bucket } from './bucket.entity';
import { Recurrente } from './recurrente.entity';
import { Meta } from './meta.entity';
import { MetaParticipante } from './meta-participante.entity';
import { AporteMeta } from './aporte-meta.entity';
import { Categoria } from './categoria.entity';

export type RolUsuario = 'admin' | 'miembro';
export type DolarPref = 'oficial' | 'mep' | 'blue';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'varchar', default: 'miembro' })
  rol: RolUsuario;

  @Column({ name: 'dolar_pref', type: 'varchar', default: 'blue' })
  dolarPref: DolarPref;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Movimiento, m => m.usuario)
  movimientos: Movimiento[];

  @OneToMany(() => Cuenta, c => c.usuario)
  cuentas: Cuenta[];

  @OneToMany(() => Bucket, b => b.usuario)
  buckets: Bucket[];

  @OneToMany(() => Recurrente, r => r.usuario)
  recurrentes: Recurrente[];

  @OneToMany(() => Meta, m => m.owner)
  metas: Meta[];

  @OneToMany(() => MetaParticipante, mp => mp.usuario)
  participaciones: MetaParticipante[];

  @OneToMany(() => AporteMeta, a => a.usuario)
  aportes: AporteMeta[];

  @OneToMany(() => Categoria, c => c.usuario)
  categorias: Categoria[];
}
