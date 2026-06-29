import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Meta } from './meta.entity';
import { Usuario } from './usuario.entity';

export type RolParticipante = 'owner' | 'participante';

@Entity('meta_participantes')
@Unique(['metaId', 'usuarioId'])
export class MetaParticipante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'meta_id' })
  metaId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ type: 'varchar', default: 'participante' })
  rol: RolParticipante;

  @ManyToOne(() => Meta, m => m.participantes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meta_id' })
  meta: Meta;

  @ManyToOne(() => Usuario, u => u.participaciones)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
