import {
  Injectable, ForbiddenException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cuenta } from '../../entities/cuenta.entity';
import { BotService } from './bot.service';
import { CuentasService } from '../cuentas/cuentas.service';
import { MovimientosService } from '../movimientos/movimientos.service';
import { CategoriasService } from '../categorias/categorias.service';

// Fecha/mes en horario de Argentina, sin depender del TZ del proceso (en-CA da YYYY-MM-DD).
function hoyAR(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());
}
function mesAR(): string {
  return hoyAR().slice(0, 7);
}

export interface RegistrarMovimientoDto {
  tipo: 'ingreso' | 'gasto';
  monto: number;
  descripcion: string;
  cuentaId?: number;
  cuenta?: string; // nombre de la cuenta, si el usuario la nombró
  fecha?: string; // YYYY-MM-DD; default hoy (AR)
}

/**
 * Acciones del bot sobre la cuenta de un usuario, resueltas por teléfono.
 * Reusa los services de negocio que ya existen (no duplica lógica de saldos).
 * La confirmación "propuesta→OK" vive en el AGENTE: acá registrar = escribe.
 */
@Injectable()
export class BotAccionesService {
  constructor(
    private readonly bot: BotService,
    private readonly cuentas: CuentasService,
    private readonly movimientos: MovimientosService,
    private readonly categorias: CategoriasService,
    @InjectRepository(Cuenta) private readonly cuentaRepo: Repository<Cuenta>,
  ) {}

  // Resuelve teléfono→usuario o corta con un mensaje que el agente le repite al usuario.
  private async requireUsuario(telefono: string): Promise<number> {
    const id = await this.bot.usuarioIdPorTelefono(telefono);
    if (!id) {
      throw new ForbiddenException(
        'Este número no está vinculado a ninguna cuenta de Cuentitas. Pedile al usuario que entre a la web → Ajustes → Vincular WhatsApp y te dicte el código.',
      );
    }
    return id;
  }

  async saldos(telefono: string) {
    const usuarioId = await this.requireUsuario(telefono);
    const cuentas = await this.cuentas.getCuentas(usuarioId);
    const totalArs = cuentas
      .filter((c) => c.moneda === 'ARS')
      .reduce((s, c) => s + (parseFloat(c.saldo) || 0), 0);
    return {
      cuentas: cuentas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        saldo: parseFloat(c.saldo) || 0,
        moneda: c.moneda,
      })),
      totalArs,
    };
  }

  async resumen(telefono: string, mes?: string) {
    const usuarioId = await this.requireUsuario(telefono);
    const m = mes && /^\d{4}-\d{2}$/.test(mes) ? mes : mesAR();
    return this.movimientos.resumen(usuarioId, m);
  }

  async registrarMovimiento(telefono: string, dto: RegistrarMovimientoDto) {
    const usuarioId = await this.requireUsuario(telefono);

    const monto = Number(dto.monto);
    if (!Number.isFinite(monto) || monto <= 0) {
      throw new BadRequestException('El monto tiene que ser un número mayor que cero.');
    }
    const descripcion = (dto.descripcion || '').trim();
    if (!descripcion) throw new BadRequestException('Falta la descripción del movimiento.');
    if (dto.tipo !== 'ingreso' && dto.tipo !== 'gasto') {
      throw new BadRequestException('Tipo inválido: debe ser "ingreso" o "gasto".');
    }

    const cuenta = await this.resolverCuenta(usuarioId, dto.cuentaId, dto.cuenta);
    const categoriaId = await this.categorias.findMatching(usuarioId, descripcion);
    const fecha = dto.fecha && /^\d{4}-\d{2}-\d{2}$/.test(dto.fecha) ? dto.fecha : hoyAR();

    const mov = await this.movimientos.crear(usuarioId, {
      tipo: dto.tipo,
      monto: monto.toFixed(2),
      descripcion,
      cuentaId: cuenta.id,
      categoriaId: categoriaId ?? undefined,
      fecha,
    });

    // Saldo fresco de la cuenta luego del movimiento (lo recalculó MovimientosService).
    const fresca = await this.cuentaRepo.findOne({ where: { id: cuenta.id, usuarioId } });

    return {
      ok: true,
      movimiento: {
        id: mov.id,
        tipo: mov.tipo,
        monto: parseFloat(mov.monto),
        descripcion: mov.descripcion,
        fecha: mov.fecha,
        categoriaId: mov.categoriaId ?? null,
      },
      cuenta: {
        id: cuenta.id,
        nombre: cuenta.nombre,
        saldo: fresca ? parseFloat(fresca.saldo) || 0 : null,
      },
    };
  }

  /**
   * Resuelve la cuenta a usar (solo ARS: las USD son de ahorro).
   *  - cuentaId explícito → valida que exista y sea ARS.
   *  - nombre → match exacto, si no parcial.
   *  - nada y hay una sola cuenta ARS → esa.
   *  - ambiguo / no encontrado → 409 con la lista para que el agente pregunte.
   */
  private async resolverCuenta(usuarioId: number, cuentaId?: number, nombre?: string) {
    const ars = (await this.cuentas.getCuentas(usuarioId)).filter((c) => c.moneda === 'ARS');
    if (!ars.length) {
      throw new BadRequestException('No tenés ninguna cuenta en pesos para registrar el movimiento.');
    }

    if (cuentaId != null) {
      const c = ars.find((x) => x.id === cuentaId);
      if (!c) throw new BadRequestException('Esa cuenta no existe o es en dólares (no se puede usar en movimientos).');
      return c;
    }

    const n = (nombre || '').trim().toLowerCase();
    if (n) {
      const exact = ars.filter((c) => c.nombre.toLowerCase() === n);
      const partial = ars.filter((c) => c.nombre.toLowerCase().includes(n));
      const match = exact.length ? exact : partial;
      if (match.length === 1) return match[0];
    } else if (ars.length === 1) {
      return ars[0];
    }

    throw new ConflictException({
      error: 'cuenta_ambigua',
      message: n
        ? `No identifiqué con seguridad la cuenta "${nombre}". Preguntale al usuario cuál de estas es.`
        : 'Falta indicar de qué cuenta es. Preguntale al usuario cuál de estas usar.',
      cuentas: ars.map((c) => ({ id: c.id, nombre: c.nombre })),
    });
  }
}
