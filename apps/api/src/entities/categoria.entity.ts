import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Movimiento } from './movimiento.entity';

@Entity('categorias')
export class Categoria {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'slug', length: 50 })
  slug: string;

  @Column({ length: 7 })
  color: string;

  @Column({ length: 100 })
  label: string;

  @Column({ type: 'jsonb', default: [] })
  matches: string[];

  @Column({ default: false })
  sistema: boolean;

  @Column({ name: 'usuario_id', nullable: true })
  usuarioId: number;

  @ManyToOne(() => Usuario, u => u.categorias, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => Movimiento, m => m.categoria)
  movimientos: Movimiento[];
}
