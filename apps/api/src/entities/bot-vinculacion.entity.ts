import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';

/**
 * Vínculo entre un número de WhatsApp y un usuario de Cuentitas.
 *
 * El bot no maneja JWTs: manda el teléfono y la API resuelve teléfono→usuario por acá.
 * El vínculo se establece con un **código de un solo uso**: el usuario lo genera desde
 * la web (queda guardado en `codigo` con `codigoExpira`), se lo dicta al bot, y el bot
 * llama a /bot/vincular con {telefono, codigo}. Recién ahí se graba `telefono` y
 * `verificadoAt`, y se limpia el código.
 *
 * Una fila por usuario (un teléfono por usuario en v1). El teléfono es único: un número
 * no puede quedar linkeado a dos usuarios.
 */
@Entity('bot_vinculaciones')
export class BotVinculacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'usuario_id', unique: true })
  usuarioId: number;

  // null hasta que el bot confirma la vinculación con el código.
  @Column({ type: 'varchar', length: 40, nullable: true, unique: true })
  telefono: string | null;

  // Timestamp de cuando el teléfono quedó verificado (null = pendiente).
  @Column({ name: 'verificado_at', type: 'timestamptz', nullable: true })
  verificadoAt: Date | null;

  // Código de un solo uso vigente (null una vez usado o si nunca se generó).
  @Column({ type: 'varchar', length: 12, nullable: true })
  codigo: string | null;

  @Column({ name: 'codigo_expira', type: 'timestamptz', nullable: true })
  codigoExpira: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Usuario, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;
}
