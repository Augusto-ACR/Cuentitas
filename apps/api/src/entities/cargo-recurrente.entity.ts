import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Recurrente } from './recurrente.entity';
import { Movimiento } from './movimiento.entity';

export type EstadoCargo = 'confirmado' | 'por-confirmar';

@Entity('cargos_recurrentes')
@Unique(['recurrenteId', 'mes'])
export class CargoRecurrente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'recurrente_id' })
  recurrenteId: number;

  @Column({ type: 'char', length: 7 })
  mes: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  monto: string;

  @Column({ type: 'varchar', default: 'por-confirmar' })
  estado: EstadoCargo;

  @Column({ name: 'movimiento_id', nullable: true })
  movimientoId: number;

  @ManyToOne(() => Recurrente, r => r.historial, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recurrente_id' })
  recurrente: Recurrente;

  @ManyToOne(() => Movimiento, { nullable: true })
  @JoinColumn({ name: 'movimiento_id' })
  movimiento: Movimiento;
}
