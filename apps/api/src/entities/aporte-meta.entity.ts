import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Meta } from './meta.entity';
import { Usuario } from './usuario.entity';

@Entity('aportes_meta')
export class AporteMeta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'meta_id' })
  metaId: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ name: 'monto_ars', type: 'numeric', precision: 14, scale: 2 })
  montoARS: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ name: 'valor_oficial', type: 'numeric', precision: 14, scale: 2 })
  valorOficial: string;

  @Column({ name: 'valor_mep', type: 'numeric', precision: 14, scale: 2 })
  valorMEP: string;

  @Column({ name: 'valor_blue', type: 'numeric', precision: 14, scale: 2 })
  valorBlue: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Meta, m => m.aportes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'meta_id' })
  meta: Meta;

  @ManyToOne(() => Usuario, u => u.aportes)
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
