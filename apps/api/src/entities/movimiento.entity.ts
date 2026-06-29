import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Categoria } from './categoria.entity';
import { Cuenta } from './cuenta.entity';
import { Recurrente } from './recurrente.entity';

export type TipoMovimiento = 'ingreso' | 'gasto';

@Entity('movimientos')
export class Movimiento {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  monto: string;

  @Column({ type: 'varchar' })
  tipo: TipoMovimiento;

  @Column({ length: 255 })
  descripcion: string;

  @Column({ name: 'categoria_id', nullable: true })
  categoriaId: number;

  @Column({ name: 'cuenta_id' })
  cuentaId: number;

  @Column({ name: 'recurrente_id', nullable: true })
  recurrenteId: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Usuario, u => u.movimientos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Categoria, c => c.movimientos, { nullable: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @ManyToOne(() => Cuenta, c => c.movimientos)
  @JoinColumn({ name: 'cuenta_id' })
  cuenta: Cuenta;

  @ManyToOne(() => Recurrente, { nullable: true })
  @JoinColumn({ name: 'recurrente_id' })
  recurrente: Recurrente;
}
