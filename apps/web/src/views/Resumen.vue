<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas · {{ mesLabelActual }}</div>
        <h1 class="page-title">Resumen</h1>
      </div>
      <div class="header-right">
        <div class="dollar-badge" v-if="dolar.cotizacionPreferida" @click="$router.push('/ajustes')" role="button" tabindex="0">
          <span class="dot"></span>
          Dólar {{ prefLabel }} {{ ars(dolar.valorPreferido) }}
        </div>
        <div class="avatar" @click="irPerfil" role="button" tabindex="0">{{ auth.usuario?.nombre?.[0] }}</div>
      </div>
    </header>

    <!-- KPIs -->
    <div class="kpi-grid" v-if="resumen">
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Ingresos</span>
          <span class="kpi-icon in">↑</span>
        </div>
        <div class="kpi-val">{{ ars(resumen.ingresos) }}</div>
        <div class="kpi-usd">{{ usd(resumen.ingresos / dolar.valorPreferido) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Gastos</span>
          <span class="kpi-icon ex">↓</span>
        </div>
        <div class="kpi-val neg">{{ ars(resumen.gastos) }}</div>
        <div class="kpi-usd">{{ usd(resumen.gastos / dolar.valorPreferido) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-top">
          <span class="kpi-label">Balance</span>
          <span class="kpi-icon" :class="resumen.balance >= 0 ? 'in' : 'ex'">≡</span>
        </div>
        <div class="kpi-val" :class="resumen.balance >= 0 ? 'pos' : 'neg'">
          {{ ars(resumen.balance) }}
        </div>
        <div class="kpi-usd">{{ usd(Math.abs(resumen.balance) / dolar.valorPreferido) }}</div>
      </div>
      <div class="kpi-card" @click="$router.push('/cuentas')" style="cursor:pointer">
        <div class="kpi-top">
          <span class="kpi-label">Bancos</span>
          <span class="kpi-icon pr">🏦</span>
        </div>
        <div class="kpi-val">{{ ars(cuentas.totalBancos) }}</div>
        <div class="kpi-usd">{{ usd(cuentas.totalBancos / dolar.valorPreferido) }}</div>
      </div>
    </div>

    <!-- Ingreso vs Gasto -->
    <div class="card" v-if="tendencia">
      <div class="card-header">
        <span class="card-title">Ingreso vs gasto</span>
        <span class="card-meta">últimos meses</span>
      </div>
      <div class="bars-container">
        <div v-for="(data, mes) in tendencia" :key="mes" class="bar-col">
          <div class="bar-pair">
            <div class="bar bar-in" :style="{ height: barHeight(data.ingresos) + 'px' }"></div>
            <div class="bar bar-ga" :style="{ height: barHeight(data.gastos) + 'px' }"></div>
          </div>
          <span class="bar-label">{{ mesLabel(String(mes)) }}</span>
        </div>
      </div>
      <div class="bars-legend">
        <span><span class="dot-in"></span>Ingresos</span>
        <span><span class="dot-ga"></span>Gastos</span>
      </div>
    </div>

    <!-- Dona categorías -->
    <div class="card" v-if="categorias.length">
      <div class="card-header">
        <span class="card-title">Gastos por categoría</span>
        <span class="card-meta">{{ mesLabelActual }}</span>
      </div>
      <div class="dona-wrap">
        <svg width="116" height="116" viewBox="0 0 120 120" style="flex:none">
          <circle cx="60" cy="60" r="50" fill="none" stroke-width="15" style="stroke:var(--surface-3)"/>
          <g transform="rotate(-90 60 60)">
            <circle v-for="seg in donutSegs" :key="seg.color"
              cx="60" cy="60" r="50" fill="none"
              :stroke="seg.color" stroke-width="15"
              :stroke-dasharray="seg.dash"
              :stroke-dashoffset="seg.offset"/>
          </g>
        </svg>
        <div class="dona-legend">
          <div v-for="c in categorias.slice(0,5)" :key="c.categoriaId" class="dona-row">
            <span class="dot-cat" :style="{ background: c.color }"></span>
            <span class="dona-label">{{ c.label }}</span>
            <span class="dona-pct">{{ ((parseFloat(c.total) / totalGastos) * 100).toFixed(0) }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximos recurrentes -->
    <div class="card" v-if="recurrentes.items.length">
      <div class="card-header">
        <span class="card-title">Próximos recurrentes</span>
        <RouterLink to="/recurrentes" class="card-link">Ver todos</RouterLink>
      </div>
      <div class="rec-list">
        <div v-for="r in recurrentes.items.slice(0,4)" :key="r.id" class="rec-row">
          <span class="rec-avatar" :style="{ background: r.categoria?.color ?? '#94A3B8' }">
            {{ r.nombre[0] }}
          </span>
          <div class="rec-info">
            <div class="rec-nombre">{{ r.nombre }}</div>
            <div class="rec-meta">día {{ r.diaAprox }}</div>
          </div>
          <span class="rec-monto">{{ ars(r.montoEstimado) }}</span>
        </div>
      </div>
    </div>

    <!-- Links rápidos -->
    <div class="quick-links">
      <RouterLink to="/cuentas" class="quick-card">
        <div class="quick-title">Cuentas</div>
        <div class="quick-val">{{ ars(cuentas.totalBancos) }}</div>
      </RouterLink>
      <RouterLink to="/metas" class="quick-card">
        <div class="quick-title">Metas</div>
        <div class="quick-val" style="color:#0D9488">{{ metas.items.length }} activas</div>
      </RouterLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useDolarStore } from '@/stores/dolar';
import { useCuentasStore } from '@/stores/cuentas';
import { useRecurrentesStore } from '@/stores/recurrentes';
import { useMetasStore } from '@/stores/metas';
import { http } from '@/lib/http';
import { ars, usd, mesLabel, mesActual } from '@/lib/format';

const auth = useAuthStore();
const dolar = useDolarStore();
const cuentas = useCuentasStore();
const recurrentes = useRecurrentesStore();
const metas = useMetasStore();
const router = useRouter();

// El avatar lleva a Usuarios si sos admin, o a Ajustes (tu perfil) si sos miembro.
function irPerfil() {
  router.push(auth.usuario?.rol === 'admin' ? '/admin' : '/ajustes');
}

const resumen = ref<any>(null);
const tendencia = ref<any>(null);
const categorias = ref<any[]>([]);
const mes = mesActual();
const mesLabelActual = computed(() => mesLabel(mes));

const prefLabel = computed(() => {
  const m: Record<string, string> = { oficial: 'Oficial', mep: 'MEP', blue: 'Blue' };
  return m[auth.usuario?.dolarPref ?? 'blue'] ?? 'Blue';
});

onMounted(async () => {
  await Promise.all([
    dolar.cargar(),
    cuentas.cargar(),
    recurrentes.cargar(),
    metas.cargar(),
  ]);
  [resumen.value, tendencia.value, categorias.value] = await Promise.all([
    http.get<any>(`/movimientos/resumen?mes=${mes}`),
    http.get<any>('/analisis/tendencia'),
    http.get<any[]>(`/analisis/categorias?mes=${mes}`),
  ]);
});

const totalGastos = computed(() =>
  categorias.value.reduce((a, c) => a + parseFloat(c.total), 0),
);

const maxIngGas = computed(() => {
  if (!tendencia.value) return 1;
  return Math.max(...Object.values(tendencia.value as any).flatMap((d: any) => [d.ingresos, d.gastos]), 1);
});

function barHeight(val: number): number {
  return Math.max(4, (val / maxIngGas.value) * 120);
}

const donutSegs = computed(() => {
  const total = totalGastos.value;
  if (!total) return [];
  const circ = 2 * Math.PI * 50;
  let offset = 0;
  return categorias.value.slice(0, 6).map(c => {
    const pct = parseFloat(c.total) / total;
    const dash = `${pct * circ} ${circ}`;
    const seg = { color: c.color, dash, offset: -offset * circ };
    offset += pct;
    return seg;
  });
});
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-sub { font-size: 11px; color: var(--text-muted); font-weight: 500; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: var(--text); margin-top: 2px; }
.header-right { display: flex; align-items: center; gap: 10px; }
.dollar-badge { display: flex; align-items: center; gap: 7px; background: var(--dollar-soft); color: var(--dollar); padding: 7px 12px; border-radius: 999px; font-size: 12.5px; font-weight: 600; cursor: pointer; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: var(--dollar); }
.avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; font-family: 'Space Grotesk', sans-serif; cursor: pointer; }

.kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 11px; margin-bottom: 14px; }
.kpi-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 13px; }
.kpi-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
.kpi-label { font-size: 11.5px; font-weight: 500; color: var(--text-soft); }
.kpi-icon { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; }
.kpi-icon.in { background: var(--income-soft); color: var(--income); }
.kpi-icon.ex { background: var(--expense-soft); color: var(--expense); }
.kpi-icon.pr { background: var(--primary-soft); color: var(--primary); }
.kpi-val.pos { color: var(--income); }
.kpi-val.neg { color: var(--expense); }
.kpi-val { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 17px; color: var(--text); letter-spacing: -0.02em; }
.kpi-usd { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--text-muted); margin-top: 5px; }

.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 14px; }
.card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.card-title { font-size: 13px; font-weight: 600; color: var(--text); }
.card-meta { font-size: 11px; color: var(--text-muted); }
.card-link { font-size: 11px; color: var(--primary); font-weight: 600; text-decoration: none; }

.bars-container { display: flex; align-items: flex-end; justify-content: space-between; height: 130px; gap: 6px; }
.bar-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.bar-pair { display: flex; align-items: flex-end; gap: 3px; height: 120px; }
.bar { width: 9px; border-radius: 3px 3px 0 0; transition: height 0.3s; }
.bar-in { background: var(--income); }
.bar-ga { background: var(--expense); }
.bar-label { font-size: 10px; color: var(--text-muted); font-weight: 500; }
.bars-legend { display: flex; gap: 16px; margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--surface-3); }
.bars-legend span { font-size: 11px; color: var(--text-soft); display: flex; align-items: center; gap: 6px; }
.dot-in { width: 8px; height: 8px; border-radius: 2px; background: var(--income); display: inline-block; }
.dot-ga { width: 8px; height: 8px; border-radius: 2px; background: var(--expense); display: inline-block; }

.dona-wrap { display: flex; align-items: center; gap: 16px; }
.dona-legend { flex: 1; display: flex; flex-direction: column; gap: 9px; }
.dona-row { display: flex; align-items: center; gap: 9px; }
.dot-cat { width: 9px; height: 9px; border-radius: 50%; flex: none; }
.dona-label { font-size: 12px; color: var(--text); font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.dona-pct { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }

.rec-list { display: flex; flex-direction: column; gap: 10px; }
.rec-row { display: flex; align-items: center; gap: 11px; }
.rec-avatar { width: 32px; height: 32px; border-radius: 9px; color: var(--surface); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 13px; font-family: 'Space Grotesk', sans-serif; flex: none; }
.rec-info { flex: 1; min-width: 0; }
.rec-nombre { font-size: 13px; font-weight: 600; color: var(--text); }
.rec-meta { font-size: 11px; color: var(--text-muted); }
.rec-monto { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; color: var(--text); }

.quick-links { display: flex; gap: 11px; }
.quick-card { flex: 1; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 14px; text-align: center; text-decoration: none; }
.quick-title { font-size: 13px; font-weight: 600; color: var(--text); }
.quick-val { font-size: 11px; color: var(--text-muted); margin-top: 2px; font-family: 'JetBrains Mono', monospace; }
</style>
