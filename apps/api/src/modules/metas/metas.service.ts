import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    // Calcular progreso por cotización preferida del usuario
    // "Dólares comprados" = suma de (montoARS / valorDelDiaDeLaCotizacionPreferida)
    const calcProgreso = (pref: DolarPref) => {
      return aportesMeta.reduce((acc, a) => {
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

  async eliminar(usuarioId: number, metaId: number) {
    const part = await this.participantes.findOne({ where: { metaId, usuarioId, rol: 'owner' } });
    if (!part) throw new ForbiddenException();
    const meta = await this.metas.findOne({ where: { id: metaId } });
    await this.metas.remove(meta);
    return { ok: true };
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

  async agregarAporte(usuarioId: number, metaId: number, montoARS: number, fecha: string, cuentaId: number) {
    // Verificar participación
    const part = await this.participantes.findOne({ where: { metaId, usuarioId } });
    if (!part) throw new ForbiddenException();

    // Congelar las 3 cotizaciones del día del aporte
    const cotizaciones = await this.dolar.ultimas();

    // Transferencia: registra el ahorro y resta de la cuenta de origen, todo en
    // una transacción para que la cuenta y el aporte nunca queden descuadrados.
    return this.dataSource.transaction(async (manager) => {
      const aporte = await manager.save(
        manager.create(AporteMeta, {
          metaId, usuarioId, cuentaId,
          montoARS: String(montoARS),
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
          .setParameter('monto', montoARS)
          .execute();
      }
      return aporte;
    });
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
