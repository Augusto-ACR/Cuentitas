import {
  Injectable, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { randomInt } from 'crypto';
import { BotVinculacion } from '../../entities/bot-vinculacion.entity';
import { Usuario } from '../../entities/usuario.entity';

// El código vive pocos minutos: se dicta al bot y se usa al toque.
const CODIGO_VIGENCIA_MIN = 10;
// Alfabeto sin caracteres ambiguos (0/O, 1/I/L) para dictarlo sin errores.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODIGO_LARGO = 6;

@Injectable()
export class BotService {
  constructor(
    @InjectRepository(BotVinculacion) private readonly repo: Repository<BotVinculacion>,
    @InjectRepository(Usuario) private readonly usuarios: Repository<Usuario>,
  ) {}

  // ── Lado usuario (auth normal) ──────────────────────────────────────────────

  /**
   * Genera (o regenera) un código de un solo uso para el usuario logueado.
   * Upsert: una fila por usuario. Devuelve el código y cuándo vence.
   */
  async generarCodigo(usuarioId: number) {
    let fila = await this.repo.findOne({ where: { usuarioId } });
    if (!fila) {
      fila = this.repo.create({ usuarioId });
    }
    fila.codigo = this.nuevoCodigo();
    fila.codigoExpira = new Date(Date.now() + CODIGO_VIGENCIA_MIN * 60_000);
    await this.repo.save(fila);
    return {
      codigo: fila.codigo,
      expiraAt: fila.codigoExpira,
      vigenciaMin: CODIGO_VIGENCIA_MIN,
    };
  }

  /** Estado de vinculación del usuario logueado (para mostrar en Ajustes). */
  async estado(usuarioId: number) {
    const fila = await this.repo.findOne({ where: { usuarioId } });
    if (!fila || !fila.verificadoAt) {
      return { vinculado: false as const };
    }
    return {
      vinculado: true as const,
      telefono: fila.telefono,
      verificadoAt: fila.verificadoAt,
    };
  }

  /** Desvincula el teléfono del usuario logueado. */
  async desvincular(usuarioId: number) {
    const fila = await this.repo.findOne({ where: { usuarioId } });
    if (fila) {
      fila.telefono = null;
      fila.verificadoAt = null;
      fila.codigo = null;
      fila.codigoExpira = null;
      await this.repo.save(fila);
    }
    return { ok: true };
  }

  // ── Lado bot (BotKeyGuard) ──────────────────────────────────────────────────

  /**
   * El bot confirma la vinculación: {telefono, codigo}. Si el código está vigente,
   * graba el teléfono y lo deja verificado. Idempotente si reenvían el mismo código.
   */
  async vincular(telefono: string, codigo: string) {
    const tel = this.normalizarTelefono(telefono);
    const cod = (codigo || '').trim().toUpperCase();
    if (!tel) throw new BadRequestException('Falta el teléfono');
    if (!cod) throw new BadRequestException('Falta el código');

    const fila = await this.repo.findOne({
      where: { codigo: cod, codigoExpira: MoreThan(new Date()) },
      relations: { usuario: true },
    });
    if (!fila) {
      throw new BadRequestException('Código inválido o vencido. Generá uno nuevo desde la web.');
    }

    // El teléfono no puede estar ya tomado por OTRO usuario.
    const ocupado = await this.repo.findOne({ where: { telefono: tel } });
    if (ocupado && ocupado.usuarioId !== fila.usuarioId) {
      throw new ConflictException('Ese teléfono ya está vinculado a otra cuenta.');
    }

    fila.telefono = tel;
    fila.verificadoAt = new Date();
    fila.codigo = null;
    fila.codigoExpira = null;
    await this.repo.save(fila);

    return {
      ok: true,
      usuario: { id: fila.usuario.id, nombre: fila.usuario.nombre },
    };
  }

  /** Resuelve teléfono→usuario para el bot. Devuelve identidad o {vinculado:false}. */
  async resolver(telefono: string) {
    const tel = this.normalizarTelefono(telefono);
    if (!tel) return { vinculado: false as const };
    const fila = await this.repo.findOne({
      where: { telefono: tel },
      relations: { usuario: true },
    });
    if (!fila || !fila.verificadoAt) return { vinculado: false as const };
    return {
      vinculado: true as const,
      usuarioId: fila.usuarioId,
      nombre: fila.usuario.nombre,
    };
  }

  /**
   * Devuelve el usuarioId verificado de un teléfono, o null si no está vinculado.
   * Lo usarán los endpoints de acción del bot para hacer el scoping.
   */
  async usuarioIdPorTelefono(telefono: string): Promise<number | null> {
    const r = await this.resolver(telefono);
    return r.vinculado ? r.usuarioId : null;
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private nuevoCodigo(): string {
    let out = '';
    for (let i = 0; i < CODIGO_LARGO; i++) {
      out += ALFABETO[randomInt(ALFABETO.length)];
    }
    return out;
  }

  // El bot manda el id tal cual lo da WhatsApp; acá solo recortamos espacios.
  // La normalización fuerte (formato @lid, etc.) la hace el bot, como en Rimainder.
  private normalizarTelefono(telefono: string): string {
    return (telefono || '').trim();
  }
}
