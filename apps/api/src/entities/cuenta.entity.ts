import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Movimiento } from './movimiento.entity';

@Entity('cuentas')
export class Cuenta {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  saldo: string;

  // Moneda del saldo: 'ARS' (default) o 'USD'. Las cuentas USD son vehículos de
  // ahorro: su saldo vive en dólares y se convierte a pesos solo para el patrimonio.
  @Column({ length: 3, default: 'ARS' })
  moneda: string;

  @Column({ length: 50, default: 'wallet' })
  icono: string;

  @ManyToOne(() => Usuario, u => u.cuentas, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => Movimiento, m => m.cuenta)
  movimientos: Movimiento[];
}
