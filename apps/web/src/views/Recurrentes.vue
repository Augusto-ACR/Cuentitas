<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Recurrentes</h1>
      </div>
    </header>

    <!-- Resumen del mes -->
    <div class="resumen-card">
      <div class="res-top">
        <span class="res-icon">↻</span>
        <span class="res-label">Total del mes · {{ mesLabel(mesActual()) }}</span>
      </div>
      <div class="res-total">{{ ars(totalMes) }}</div>
      <div class="res-tags">
        <span class="tag purple">{{ pctGastos }}% de tus gastos</span>
        <span class="res-usd">{{ usd(totalMes / dolar.valorPreferido) }}</span>
      </div>
      <div class="res-row">
        <div class="res-item">
          <div class="res-item-label green">● Confirmado</div>
          <div class="res-item-val">{{ ars(totalConfirmado) }}</div>
        </div>
        <div class="res-item">
          <div class="res-item-label warn">● Estimado</div>
          <div class="res-item-val muted">{{ ars(totalEstimado) }}</div>
        </div>
      </div>
    </div>

    <!-- Alerta por confirmar -->
    <div class="alerta" v-if="porConfirmarN > 0">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#B45309" stroke-width="1.8" stroke-linecap="round"><path d="M12 8v5"/><circle cx="12" cy="16.5" r=".4"/><circle cx="12" cy="12" r="9"/></svg>
      <span><strong>{{ porConfirmarN }} por confirmar.</strong> Los precios cambian todos los meses — revisá que el monto sea el real.</span>
    </div>

    <!-- Lista -->
    <div class="section-title">Lo que se repite todos los meses</div>
    <div class="rec-list">
      <div v-for="r in store.items" :key="r.id" class="rec-card" :style="{ borderLeftColor: r.categoria?.color ?? '#94A3B8' }">
        <div class="rec-top">
          <span class="rec-avatar" :style="{ background: r.categoria?.color ?? '#94A3B8' }">{{ r.nombre[0] }}</span>
          <div class="rec-info">
            <div class="rec-nombre">{{ r.nombre }}</div>
            <div class="rec-meta">{{ r.categoria?.label }} · día {{ r.diaAprox }}</div>
          </div>
          <div class="rec-right">
            <div class="rec-monto">{{ ars(r.cargoMes?.monto ?? r.montoEstimado) }}</div>
            <div class="rec-delta" v-if="r.cargoMes?.estado === 'confirmado'" style="color:#16A34A">Confirmado</div>
          </div>
        </div>
        <div class="rec-footer">
          <span class="estado-pill" :class="r.cargoMes?.estado === 'confirmado' ? 'confirmado' : 'pendiente'">
            <span class="dot"></span>{{ r.cargoMes?.estado === 'confirmado' ? 'Confirmado' : 'Por confirmar' }}
          </span>
          <button v-if="r.cargoMes?.estado !== 'confirmado'" class="btn-confirmar" @click="abrirConfirmar(r)">
            Confirmar precio
          </button>
        </div>
      </div>
    </div>

    <!-- Modal confirmar precio -->
    <div v-if="modal" class="modal-overlay" @click.self="modal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Confirmar precio · {{ confirmandoRec?.nombre }}</h2>
          <button @click="modal = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="confirmar" style="display:flex;flex-direction:column;gap:14px">
          <div class="field">
            <label>Monto real de este mes</label>
            <input v-model="montoConfirmar" type="number" min="0" step="0.01" required />
          </div>
          <p v-if="deltaResult !== null" class="delta-info">
            Δ vs mes anterior: <strong>{{ deltaResult > 0 ? '+' : '' }}{{ deltaResult }}%</strong>
          </p>
          <button type="submit" class="btn-guardar">Confirmar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRecurrentesStore } from '@/stores/recurrentes';
import { useDolarStore } from '@/stores/dolar';
import { useMovimientosStore } from '@/stores/movimientos';
import { ars, usd, mesLabel, mesActual } from '@/lib/format';

const store = useRecurrentesStore();
const dolar = useDolarStore();
const movStore = useMovimientosStore();
const mes = mesActual();

const modal = ref(false);
const confirmandoRec = ref<any>(null);
const montoConfirmar = ref('');
const deltaResult = ref<number | null>(null);

const totalMes = computed(() => store.items.reduce((a, r) => a + parseFloat(r.cargoMes?.monto ?? r.montoEstimado), 0));
const totalConfirmado = computed(() => store.items.filter(r => r.cargoMes?.estado === 'confirmado').reduce((a, r) => a + parseFloat(r.cargoMes?.monto ?? 0), 0));
const totalEstimado = computed(() => store.items.filter(r => r.cargoMes?.estado !== 'confirmado').reduce((a, r) => a + parseFloat(r.montoEstimado), 0));
const porConfirmarN = computed(() => store.items.filter(r => r.cargoMes?.estado !== 'confirmado').length);
const pctGastos = computed(() => {
  const gastos = movStore.resumen?.gastos ?? 0;
  return gastos ? ((totalMes.value / gastos) * 100).toFixed(0) : '0';
});

function abrirConfirmar(r: any) {
  confirmandoRec.value = r;
  montoConfirmar.value = String(parseFloat(r.montoEstimado));
  deltaResult.value = null;
  modal.value = true;
}

async function confirmar() {
  const res = await store.confirmar(confirmandoRec.value.id, mes, parseFloat(montoConfirmar.value));
  deltaResult.value = res.delta;
  if (res.delta === null) modal.value = false;
}

onMounted(async () => {
  dolar.cargar();
  await store.cargar(mes);
  await movStore.cargarResumen();
});
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { margin-bottom: 18px; }
.page-sub { font-size: 11px; color: #94A3B8; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; }

.resumen-card { background: #fff; border: 1px solid #E6E9EF; border-radius: 18px; padding: 18px; margin-bottom: 14px; }
.res-top { display: flex; align-items: center; gap: 8px; color: #A855F7; margin-bottom: 8px; font-size: 12px; font-weight: 600; }
.res-icon { font-size: 16px; }
.res-total { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 28px; color: #0F172A; letter-spacing: -0.02em; }
.res-tags { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.tag { font-size: 11px; font-weight: 600; padding: 3px 9px; border-radius: 999px; }
.tag.purple { color: #A855F7; background: #F3E8FF; }
.res-usd { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }
.res-row { display: flex; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid #EEF1F5; }
.res-item { flex: 1; }
.res-item-label { font-size: 10.5px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
.res-item-label.green { color: #16A34A; }
.res-item-label.warn { color: #B45309; }
.res-item-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: #0F172A; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.res-item-val.muted { color: #475569; }

.alerta { display: flex; align-items: flex-start; gap: 9px; background: #FEF3C7; border: 1px solid #FCE9A8; border-radius: 13px; padding: 11px 14px; margin-bottom: 16px; font-size: 12px; color: #92400E; line-height: 1.4; }

.section-title { font-size: 13px; font-weight: 600; color: #0F172A; margin-bottom: 12px; }
.rec-list { display: flex; flex-direction: column; gap: 11px; }
.rec-card { background: #fff; border: 1px solid #E6E9EF; border-left: 3px solid #94A3B8; border-radius: 15px; padding: 13px; }
.rec-top { display: flex; align-items: center; gap: 12px; }
.rec-avatar { width: 38px; height: 38px; border-radius: 10px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; font-family: 'Space Grotesk', sans-serif; flex: none; }
.rec-info { flex: 1; min-width: 0; }
.rec-nombre { font-size: 13.5px; font-weight: 600; color: #0F172A; }
.rec-meta { font-size: 11px; color: #94A3B8; margin-top: 2px; }
.rec-right { text-align: right; }
.rec-monto { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #0F172A; }
.rec-delta { font-size: 10px; font-weight: 600; color: #16A34A; margin-top: 2px; }
.rec-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 11px; padding-top: 10px; border-top: 1px solid #F1F5F9; }
.estado-pill { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 4px 9px; border-radius: 999px; }
.estado-pill.confirmado { color: #16A34A; background: #E7F6EC; }
.estado-pill.pendiente { color: #B45309; background: #FEF3C7; }
.dot { width: 6px; height: 6px; border-radius: 50%; background: currentColor; }
.btn-confirmar { display: inline-flex; align-items: center; gap: 5px; font-size: 11.5px; color: #4F46E5; font-weight: 600; background: none; border: none; cursor: pointer; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 16px; color: #0F172A; }
.btn-cerrar { background: none; border: none; color: #94A3B8; font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: #475569; }
.field input { padding: 10px 12px; border: 1px solid #E6E9EF; border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.delta-info { font-size: 13px; color: #475569; background: #F6F7F9; padding: 10px 12px; border-radius: 10px; }
.btn-guardar { padding: 12px; background: #4F46E5; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
