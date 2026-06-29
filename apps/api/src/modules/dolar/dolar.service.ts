import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { CotizacionDolar, TipoDolar } from '../../entities/cotizacion-dolar.entity';

const FALLBACK = { oficial: 1000, mep: 1400, blue: 1478 };

@Injectable()
export class DolarService implements OnModuleInit {
  private readonly logger = new Logger(DolarService.name);

  constructor(
    @InjectRepository(CotizacionDolar)
    private readonly repo: Repository<CotizacionDolar>,
  ) {}

  async onModuleInit() {
    await this.actualizar();
  }

  // Corre varias veces por día en horario AR
  @Cron('0 9,12,15,18 * * 1-5', { timeZone: 'America/Argentina/Buenos_Aires' })
  async actualizar() {
    try {
      const url = process.env.DOLAR_API || 'https://dolarapi.com/v1/dolares';
      const { data } = await axios.get(url, { timeout: 8000 });

      const casas: Record<string, TipoDolar> = {
        oficial: 'oficial',
        blue: 'blue',
        bolsa: 'mep',
        mep: 'mep',
      };

      for (const item of data) {
        const tipo = casas[item.casa?.toLowerCase()];
        if (!tipo) continue;
        const compra = parseFloat(item.compra) || 0;
        const venta = parseFloat(item.venta) || compra;
        await this.repo.save(
          this.repo.create({ tipo, compra: String(compra), venta: String(venta), valor: String(venta), fuente: 'dolarapi' }),
        );
      }
      this.logger.log('Cotizaciones actualizadas');
    } catch (err) {
      this.logger.warn(`No se pudo actualizar dólar: ${err.message}`);
    }
  }

  async ultimas(): Promise<Record<TipoDolar, CotizacionDolar>> {
    const tipos: TipoDolar[] = ['oficial', 'mep', 'blue'];
    const result: any = {};
    for (const tipo of tipos) {
      const row = await this.repo.findOne({
        where: { tipo },
        order: { fecha: 'DESC' },
      });
      result[tipo] = row ?? this.fallback(tipo);
    }
    return result;
  }

  async ultimoPorTipo(tipo: TipoDolar): Promise<number> {
    const row = await this.repo.findOne({ where: { tipo }, order: { fecha: 'DESC' } });
    return row ? parseFloat(row.valor) : FALLBACK[tipo];
  }

  async historial(tipo: TipoDolar) {
    return this.repo.find({ where: { tipo }, order: { fecha: 'DESC' }, take: 90 });
  }

  private fallback(tipo: TipoDolar): CotizacionDolar {
    const v = String(FALLBACK[tipo]);
    return { id: 0, fecha: new Date(), tipo, compra: v, venta: v, valor: v, fuente: 'fallback' };
  }
}
