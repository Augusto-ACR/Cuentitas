import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Categoria } from './categoria.entity';
import { Cuenta } from './cuenta.entity';

@Entity('recurrentes')
export class Recurrente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ name: 'categoria_id', nullable: true })
  categoriaId: number;

  @Column({ name: 'cuenta_id' })
  cuentaId: number;

  @Column({ name: 'dia_aprox', default: 1 })
  diaAprox: number;

  @Column({ name: 'monto_estimado', type: 'numeric', precision: 14, scale: 2 })
  montoEstimado: string;

  @ManyToOne(() => Usuario, u => u.recurrentes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @ManyToOne(() => Categoria, { nullable: true })
  @JoinColumn({ name: 'categoria_id' })
  categoria: Categoria;

  @ManyToOne(() => Cuenta)
  @JoinColumn({ name: 'cuenta_id' })
  cuenta: Cuenta;
}
