<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Análisis</h1>
      </div>
    </header>

    <!-- Tendencia ingresos vs gastos -->
    <div class="card" v-if="tendencia">
      <div class="card-header">
        <span class="card-title">Ingresos vs gastos</span>
        <span class="card-meta">últimos 6 meses</span>
      </div>
      <div class="bars-container">
        <div v-for="(data, m) in tendencia" :key="m" class="bar-col">
          <div class="bar-pair">
            <div class="bar bar-in" :style="{ height: barH(data.ingresos) + 'px' }"></div>
            <div class="bar bar-ga" :style="{ height: barH(data.gastos) + 'px' }"></div>
          </div>
          <span class="bar-label">{{ mesLabel(String(m)) }}</span>
        </div>
      </div>
      <div class="bars-legend">
        <span><span class="dot-in"></span>Ingresos</span>
        <span><span class="dot-ga"></span>Gastos</span>
      </div>
    </div>

    <!-- Categorías del mes -->
    <div class="card" v-if="categorias.length">
      <div class="card-header">
        <span class="card-title">Gastos por categoría</span>
        <span class="card-meta">{{ mesLabel(mes) }}</span>
      </div>
      <div class="dona-wrap">
        <svg width="110" height="110" viewBox="0 0 120 120" style="flex:none">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#EEF1F5" stroke-width="15"/>
          <g transform="rotate(-90 60 60)">
            <circle v-for="seg in donutSegs" :key="seg.color"
              cx="60" cy="60" r="50" fill="none"
              :stroke="seg.color" stroke-width="15"
              :stroke-dasharray="seg.dash" :stroke-dashoffset="seg.offset"/>
          </g>
        </svg>
        <div class="dona-legend">
          <div v-for="c in categorias.slice(0,6)" :key="c.categoriaId" class="dona-row">
            <span class="dot-cat" :style="{ background: c.color }"></span>
            <span class="dona-label">{{ c.label }}</span>
            <span class="dona-val">{{ ars(c.total) }}</span>
            <span class="dona-pct">{{ pct(c.total) }}%</span>
          </div>
        </div>
      </div>

      <!-- Ranking completo -->
      <div class="ranking" v-if="categorias.length > 6">
        <div v-for="c in categorias.slice(6)" :key="c.categoriaId" class="rank-row">
          <span class="dot-cat" :style="{ background: c.color }"></span>
          <span class="rank-label">{{ c.label }}</span>
          <div class="rank-bar-wrap">
            <div class="rank-bar" :style="{ width: pct(c.total) + '%', background: c.color + '80' }"></div>
          </div>
          <span class="rank-val">{{ pct(c.total) }}%</span>
        </div>
      </div>
    </div>

    <!-- Top descripciones -->
    <div class="card" v-if="topDescr.length">
      <div class="card-header">
        <span class="card-title">Top gastos</span>
        <span class="card-meta">{{ mesLabel(mes) }}</span>
      </div>
      <div class="descr-list">
        <div v-for="(d, i) in topDescr" :key="d.descripcion" class="descr-row">
          <span class="descr-rank">#{{ i + 1 }}</span>
          <span class="descr-name">{{ d.descripcion }}</span>
          <span class="descr-count">{{ d.count }}×</span>
          <span class="descr-total">{{ ars(d.total) }}</span>
        </div>
      </div>
    </div>

    <!-- Gasto en dólares -->
    <div class="card" v-if="resumenMes">
      <div class="card-header">
        <span class="card-title">Poder de compra</span>
        <span class="card-meta">en USD al tipo {{ prefLabel }}</span>
      </div>
      <div class="usd-row">
        <div class="usd-item">
          <div class="usd-label">Ingresos</div>
          <div class="usd-val green">{{ usd(resumenMes.ingresos / dolar.valorPreferido) }}</div>
        </div>
        <div class="usd-item">
          <div class="usd-label">Gastos</div>
          <div class="usd-val red">{{ usd(resumenMes.gastos / dolar.valorPreferido) }}</div>
        </div>
        <div class="usd-item">
          <div class="usd-label">Balance</div>
          <div class="usd-val" :class="resumenMes.balance >= 0 ? 'green' : 'red'">{{ usd(resumenMes.balance / dolar.valorPreferido) }}</div>
        </div>
      </div>
      <div class="tipo-badge">
        <span>Dólar {{ prefLabel }}</span>
        <strong>{{ ars(dolar.valorPreferido) }}</strong>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useDolarStore } from '@/stores/dolar';
import { useAuthStore } from '@/stores/auth';
import { http } from '@/lib/http';
import { ars, usd, mesLabel, mesActual } from '@/lib/format';

const dolar = useDolarStore();
const auth = useAuthStore();
const mes = mesActual();

const tendencia = ref<any>(null);
const categorias = ref<any[]>([]);
const topDescr = ref<any[]>([]);
const resumenMes = ref<any>(null);

const prefLabel = computed(() => ({ oficial: 'Oficial', mep: 'MEP', blue: 'Blue' }[auth.usuario?.dolarPref ?? 'blue'] ?? 'Blue'));

const totalGastos = computed(() => categorias.value.reduce((a, c) => a + parseFloat(c.total), 0));

function pct(val: string | number): string {
  const total = totalGastos.value;
  return total ? ((parseFloat(String(val)) / total) * 100).toFixed(0) : '0';
}

const maxIngGas = computed(() => {
  if (!tendencia.value) return 1;
  return Math.max(...Object.values(tendencia.value as any).flatMap((d: any) => [d.ingresos, d.gastos]), 1);
});

function barH(val: number): number { return Math.max(4, (val / maxIngGas.value) * 120); }

const donutSegs = computed(() => {
  const total = totalGastos.value;
  if (!total) return [];
  const circ = 2 * Math.PI * 50;
  let offset = 0;
  return categorias.value.slice(0, 6).map(c => {
    const pctVal = parseFloat(c.total) / total;
    const dash = `${pctVal * circ} ${circ}`;
    const seg = { color: c.color, dash, offset: -offset * circ };
    offset += pctVal;
    return seg;
  });
});

onMounted(async () => {
  dolar.cargar();
  [tendencia.value, categorias.value, topDescr.value, resumenMes.value] = await Promise.all([
    http.get<any>('/analisis/tendencia'),
    http.get<any[]>(`/analisis/categorias?mes=${mes}`),
    http.get<any[]>(`/analisis/top-descripciones?mes=${mes}`),
    http.get<any>(`/movimientos/resumen?mes=${mes}`),
  ]);
});
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { margin-bottom: 18px; }
.page-sub { font-size: 11px; color: #94A3B8; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; }
.card { background: #fff; border: 1px solid #E6E9EF; border-radius: 16px; padding: 16px; margin-bottom: 14px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 13px; font-weight: 600; color: #0F172A; }
.card-meta { font-size: 11px; color: #94A3B8; }

.bars-container { display: flex; align-items: flex-end; justify-content: space-between; height: 130px; gap: 6px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.bar-pair { display: flex; align-items: flex-end; gap: 3px; height: 120px; }
.bar { width: 9px; border-radius: 3px 3px 0 0; transition: height 0.3s; }
.bar-in { background: #16A34A; }
.bar-ga { background: #E11D48; }
.bar-label { font-size: 10px; color: #94A3B8; font-weight: 500; }
.bars-legend { display: flex; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid #EEF1F5; }
.bars-legend span { font-size: 11px; color: #475569; display: flex; align-items: center; gap: 6px; }
.dot-in { width: 8px; height: 8px; border-radius: 2px; background: #16A34A; display: inline-block; }
.dot-ga { width: 8px; height: 8px; border-radius: 2px; background: #E11D48; display: inline-block; }

.dona-wrap { display: flex; align-items: center; gap: 14px; }
.dona-legend { flex: 1; display: flex; flex-direction: column; gap: 7px; }
.dona-row { display: flex; align-items: center; gap: 8px; }
.dot-cat { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.dona-label { font-size: 12px; color: #0F172A; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dona-val { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #475569; }
.dona-pct { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; min-width: 30px; text-align: right; }

.ranking { margin-top: 14px; padding-top: 14px; border-top: 1px solid #EEF1F5; display: flex; flex-direction: column; gap: 9px; }
.rank-row { display: flex; align-items: center; gap: 8px; }
.rank-label { font-size: 12px; color: #0F172A; width: 100px; flex: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rank-bar-wrap { flex: 1; height: 6px; background: #EEF1F5; border-radius: 999px; overflow: hidden; }
.rank-bar { height: 100%; border-radius: 999px; transition: width 0.4s; }
.rank-val { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; min-width: 30px; text-align: right; }

.descr-list { display: flex; flex-direction: column; gap: 10px; }
.descr-row { display: flex; align-items: center; gap: 10px; }
.descr-rank { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; min-width: 22px; }
.descr-name { flex: 1; font-size: 12.5px; color: #0F172A; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.descr-count { font-size: 11px; color: #94A3B8; }
.descr-total { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #0F172A; }

.usd-row { display: flex; gap: 10px; margin-bottom: 14px; }
.usd-item { flex: 1; background: #F8F9FC; border-radius: 13px; padding: 11px 12px; text-align: center; }
.usd-label { font-size: 10.5px; color: #94A3B8; }
.usd-val { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px; margin-top: 2px; }
.usd-val.green { color: #16A34A; }
.usd-val.red { color: #E11D48; }
.tipo-badge { display: flex; align-items: center; justify-content: space-between; background: #E8EFFD; border-radius: 12px; padding: 9px 12px; font-size: 12px; color: #2563EB; }
</style>
