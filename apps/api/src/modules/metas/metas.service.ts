import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Meta } from '../../entities/meta.entity';
import { MetaParticipante } from '../../entities/meta-participante.entity';
import { AporteMeta } from '../../entities/aporte-meta.entity';
import { Cuenta } from '../../entities/cuenta.entity';
import { DolarService } from '../dolar/dolar.service';
import { DolarPref } from '../../entities/usuario.entity';

// EXCEPCIÓN DE SCOPING: las metas compartidas se scopean por PARTICIPACIÓN
// (MetaParticipante.usuarioId), no por ownerId. Es la única excepción al guard
// de scoping por usuarioId. Ver scoping.guard.ts para el caso general.
@Injectable()
export class MetasService {
  constructor(
    @InjectRepository(Meta) private readonly metas: Repository<Meta>,
    @InjectRepository(MetaParticipante) private readonly participantes: Repository<MetaParticipante>,
    @InjectRepository(AporteMeta) private readonly aportes: Repository<AporteMeta>,
    private readonly dolar: DolarService,
    private readonly dataSource: DataSource,
  ) {}

  // Devuelve SOLO las metas donde el usuario es participante (scoping por participación)
  async listar(usuarioId: number) {
    const participaciones = await this.participantes.find({
      where: { usuarioId },
      relations: ['meta', 'meta.participantes', 'meta.participantes.usuario'],
    });
    const metaIds = [...new Set(participaciones.map(p => p.metaId))];
    if (metaIds.length === 0) return [];

    const metasData = await Promise.all(metaIds.map(id => this.getDetalle(usuarioId, id)));
    return metasData;
  }

  async crear(usuarioId: number, data: { titulo: string; objetivoUSD?: number | null; plazoMeses?: number | null; tipo?: 'personal' | 'compartida' }) {
    const meta = await this.metas.save(
      this.metas.create({
        titulo: data.titulo,
        objetivoUSD: data.objetivoUSD != null ? String(data.objetivoUSD) : null,
        plazoMeses: data.plazoMeses != null ? data.plazoMeses : null,
        ownerId: usuarioId,
        tipo: data.tipo ?? 'personal',
      }),
    );
    // Agregar al owner como participante
    await this.participantes.save(
      this.participantes.create({ metaId: meta.id, usuarioId, rol: 'owner' }),
    );
    return meta;
  }

  async getDetalle(usuarioId: number, metaId: number) {
    // Verificar participación (scoping por participación — excepción documentada)
    const part = await this.participantes.findOne({ where: { metaId, usuarioId } });
    if (!part) throw new NotFoundException();

    const meta = await this.metas.findOne({
      where: { id: metaId },
      relations: ['participantes', 'participantes.usuario'],
    });

    const cotizaciones = await this.dolar.ultimas();
    const aportesMeta = await this.aportes.find({ where: { metaId }, order: { fecha: 'DESC' } });

    // Calcular progreso por cotización preferida del usuario.
    // - Aportes en ARS: "dólares comprados" = montoARS / cotización del día del aporte.
    // - Aportes en USD: el valor en dólares es nativo (montoUSD), no depende de la
    //   cotización ni de la preferencia (ya están ahorrados como dólares).
    const calcProgreso = (pref: DolarPref) => {
      return aportesMeta.reduce((acc, a) => {
        if (a.moneda === 'USD' && a.montoUSD != null) {
          return acc + parseFloat(a.montoUSD);
        }
        const valor = pref === 'oficial' ? parseFloat(a.valorOficial)
          : pref === 'mep' ? parseFloat(a.valorMEP)
          : parseFloat(a.valorBlue);
        return acc + parseFloat(a.montoARS) / valor;
      }, 0);
    };

    const objetivo = meta.objetivoUSD != null ? parseFloat(meta.objetivoUSD) : null;

    // Aportes visibles: solo los de ESA meta. Los usuarios ven aportes de TODOS los participantes de la meta
    // pero NADA más de los otros usuarios (frontera de privacidad quirúrgica).
    return {
      ...meta,
      aportes: aportesMeta,
      progreso: {
        oficial: calcProgreso('oficial'),
        mep: calcProgreso('mep'),
        blue: calcProgreso('blue'),
      },
      cotizacionHoy: cotizaciones,
      objetivo,
    };
  }

  async actualizar(usuarioId: number, metaId: number, data: any) {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId, rol: 'owner' } });
    if (!part) throw new ForbiddenException('Solo el owner puede editar la meta');
    await this.metas.update(metaId, data);
    return this.metas.findOne({ where: { id: metaId } });
  }

  async eliminar(usuarioId: number, metaId: number, cuentaDevolucionId?: number) {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId, rol: 'owner' } });
    if (!part) throw new ForbiddenException();
    return this.dataSource.transaction(async (manager) => {
      // Si todavía tiene plata ahorrada, devolverla a la cuenta indicada antes de borrar.
      const total = await this.totalDeMeta(manager, metaId);
      if (total > 0 && cuentaDevolucionId) {
        await manager.createQueryBuilder()
          .update(Cuenta)
          .set({ saldo: () => 'saldo + :monto' })
          .where('id = :cuentaId AND usuario_id = :usuarioId', { cuentaId: cuentaDevolucionId, usuarioId })
          .setParameter('monto', total)
          .execute();
      }
      const meta = await manager.findOne(Meta, { where: { id: metaId } });
      await manager.remove(meta);
      return { ok: true };
    });
  }

  async agregarParticipante(usuarioId: number, metaId: number, nuevoUsuarioId: number) {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId, rol: 'owner' } });
    if (!part) throw new ForbiddenException('Solo el owner puede agregar participantes');
    const existe = await this.participantes.findOne({ where: { metaId, usuarioId: nuevoUsuarioId } });
    if (existe) return existe;
    return this.participantes.save(
      this.participantes.create({ metaId, usuarioId: nuevoUsuarioId, rol: 'participante' }),
    );
  }

  async quitarParticipante(usuarioId: number, metaId: number, quitarId: number) {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId, rol: 'owner' } });
    if (!part) throw new ForbiddenException();
    const p = await this.participantes.findOne({ where: { metaId, usuarioId: quitarId } });
    if (!p) throw new NotFoundException();
    await this.participantes.remove(p);
    return { ok: true };
  }

  // `monto` está expresado en la moneda indicada (ARS o USD). Si es USD, sale de
  // una cuenta en dólares y la meta lo cuenta como dólares nativos (sin dolarizar);
  // se guarda además una valuación en pesos (al blue del día) para los totales ARS.
  async agregarAporte(usuarioId: number, metaId: number, monto: number, fecha: string, cuentaId: number, moneda: string = 'ARS') {
    // Verificar participación
    const part = await this.participantes.findOne({ where: { metaId, usuarioId } });
    if (!part) throw new ForbiddenException();

    // Congelar las 3 cotizaciones del día del aporte
    const cotizaciones = await this.dolar.ultimas();
    const esUSD = moneda === 'USD';
    const montoARS = esUSD ? monto * parseFloat(cotizaciones.blue.valor) : monto;

    // Transferencia: registra el ahorro y resta de la cuenta de origen (en su propia
    // moneda), todo en una transacción para que cuenta y aporte nunca se descuadren.
    return this.dataSource.transaction(async (manager) => {
      const aporte = await manager.save(
        manager.create(AporteMeta, {
          metaId, usuarioId, cuentaId,
          montoARS: String(montoARS),
          moneda: esUSD ? 'USD' : 'ARS',
          montoUSD: esUSD ? String(monto) : null,
          fecha,
          valorOficial: cotizaciones.oficial.valor,
          valorMEP: cotizaciones.mep.valor,
          valorBlue: cotizaciones.blue.valor,
        }),
      );
      if (cuentaId) {
        await manager.createQueryBuilder()
          .update(Cuenta)
          .set({ saldo: () => 'saldo - :monto' })
          .where('id = :cuentaId AND usuario_id = :usuarioId', { cuentaId, usuarioId })
          .setParameter('monto', monto)
          .execute();
      }
      return aporte;
    });
  }

  // Total ahorrado en una meta (suma de aportes menos retiros, en ARS).
  private async totalDeMeta(manager: any, metaId: number): Promise<number> {
    const row = await manager.createQueryBuilder(AporteMeta, 'a')
      .select('COALESCE(SUM(a.monto_ars::numeric), 0)', 'sum')
      .where('a.meta_id = :metaId', { metaId })
      .getRawOne();
    return parseFloat(row.sum) || 0;
  }

  // Retiro: saca plata del ahorro (parcial o total) y la devuelve a una cuenta.
  // Se registra como un aporte negativo, con las cotizaciones del día del retiro.
  async retirar(usuarioId: number, metaId: number, monto: number, fecha: string, cuentaId: number, moneda: string = 'ARS') {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId } });
    if (!part) throw new ForbiddenException();
    const m = Math.abs(monto);
    const cotizaciones = await this.dolar.ultimas();
    const esUSD = moneda === 'USD';
    // Valuación en pesos del retiro, para comparar contra el total ahorrado (en ARS).
    const montoARS = esUSD ? m * parseFloat(cotizaciones.blue.valor) : m;

    return this.dataSource.transaction(async (manager) => {
      const total = await this.totalDeMeta(manager, metaId);
      if (montoARS > total + 0.01) throw new BadRequestException('No podés retirar más de lo ahorrado');
      await manager.save(
        manager.create(AporteMeta, {
          metaId, usuarioId, cuentaId,
          montoARS: String(-montoARS),
          moneda: esUSD ? 'USD' : 'ARS',
          montoUSD: esUSD ? String(-m) : null,
          fecha,
          valorOficial: cotizaciones.oficial.valor,
          valorMEP: cotizaciones.mep.valor,
          valorBlue: cotizaciones.blue.valor,
        }),
      );
      if (cuentaId) {
        await manager.createQueryBuilder()
          .update(Cuenta)
          .set({ saldo: () => 'saldo + :monto' })
          .where('id = :cuentaId AND usuario_id = :usuarioId', { cuentaId, usuarioId })
          .setParameter('monto', m)
          .execute();
      }
      return { ok: true };
    });
  }

  // Marca la meta como lograda. El festejo es del lado del front.
  async completar(usuarioId: number, metaId: number) {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId, rol: 'owner' } });
    if (!part) throw new ForbiddenException('Solo el owner puede completar la meta');
    await this.metas.update(metaId, { completada: true });
    return { ok: true };
  }

  // Total ahorrado por el usuario en ARS (suma de SUS aportes a cualquier meta/ahorro).
  // Respeta el scoping: solo cuenta los aportes hechos por este usuario.
  async totalAhorrado(usuarioId: number) {
    const row = await this.aportes.createQueryBuilder('a')
      .select('COALESCE(SUM(a.monto_ars::numeric), 0)', 'sum')
      .where('a.usuario_id = :usuarioId', { usuarioId })
      .getRawOne();
    return { totalARS: parseFloat(row.sum) || 0 };
  }
}
