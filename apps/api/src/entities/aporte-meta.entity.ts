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

  // Cuenta de la que salió la plata del aporte (transferencia). Nullable por
  // compatibilidad con aportes viejos previos a la unificación de ahorros.
  @Column({ name: 'cuenta_id', nullable: true })
  cuentaId: number | null;

  @Column({ name: 'monto_ars', type: 'numeric', precision: 14, scale: 2 })
  montoARS: string;

  // Moneda en la que se hizo el aporte: 'ARS' (default) o 'USD'.
  @Column({ length: 3, default: 'ARS' })
  moneda: string;

  // Monto nativo en USD cuando moneda='USD' (es lo que cuenta para el progreso de
  // la meta, sin dolarizar). Para aportes en ARS queda null. Negativo en retiros.
  @Column({ name: 'monto_usd', type: 'numeric', precision: 14, scale: 2, nullable: true })
  montoUSD: string | null;

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
