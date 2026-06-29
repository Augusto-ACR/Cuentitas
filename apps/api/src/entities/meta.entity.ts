import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { MetaParticipante } from './meta-participante.entity';
import { AporteMeta } from './aporte-meta.entity';
import { DolarPref } from './usuario.entity';

export type TipoMeta = 'personal' | 'compartida';

@Entity('metas')
export class Meta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'owner_id' })
  ownerId: number;

  @Column({ length: 150 })
  titulo: string;

  // Opcionales: una meta sin objetivo/plazo es un "ahorro" abierto (sin meta fija).
  @Column({ name: 'objetivo_usd', type: 'numeric', precision: 14, scale: 2, nullable: true })
  objetivoUSD: string | null;

  @Column({ name: 'plazo_meses', nullable: true })
  plazoMeses: number | null;

  @Column({ type: 'varchar', default: 'personal' })
  tipo: TipoMeta;

  @Column({ name: 'rate_type_override', type: 'varchar', nullable: true })
  rateTypeOverride: DolarPref;

  @Column({ type: 'boolean', default: false })
  completada: boolean;

  @ManyToOne(() => Usuario, u => u.metas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'owner_id' })
  owner: Usuario;

  @OneToMany(() => MetaParticipante, mp => mp.meta, { cascade: true })
  participantes: MetaParticipante[];

  @OneToMany(() => AporteMeta, a => a.meta, { cascade: true })
  aportes: AporteMeta[];
}
