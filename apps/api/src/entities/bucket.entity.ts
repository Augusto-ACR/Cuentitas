import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';

@Entity('buckets')
export class Bucket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  monto: string;

  @ManyToOne(() => Usuario, u => u.buckets, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
