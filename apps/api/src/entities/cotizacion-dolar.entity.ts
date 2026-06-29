import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

export type TipoDolar = 'oficial' | 'mep' | 'blue';

@Entity('cotizaciones_dolar')
export class CotizacionDolar {
  @PrimaryGeneratedColumn()
  id: number;

  @CreateDateColumn({ name: 'fecha' })
  fecha: Date;

  @Column({ type: 'varchar' })
  tipo: TipoDolar;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  compra: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  venta: string;

  @Column({ type: 'numeric', precision: 14, scale: 2 })
  valor: string;

  @Column({ length: 50 })
  fuente: string;
}
