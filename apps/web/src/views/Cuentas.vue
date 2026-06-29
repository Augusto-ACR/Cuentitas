<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Cuentas</h1>
      </div>
      <div class="avatar">{{ auth.usuario?.nombre?.[0] }}</div>
    </header>

    <!-- Patrimonio total -->
    <div class="patrimonio-card">
      <div class="pat-label">Patrimonio total</div>
      <div class="pat-val">{{ ars(store.totalBancos + store.totalAhorros) }}</div>
      <div class="pat-usd">{{ usd((store.totalBancos + store.totalAhorros) / dolar.valorPreferido) }} · {{ prefLabel }}</div>
      <div class="pat-row">
        <div class="pat-item">
          <div class="pat-item-label">Bancos</div>
          <div class="pat-item-val">{{ ars(store.totalBancos) }}</div>
        </div>
        <div class="pat-item">
          <div class="pat-item-label">Ahorros</div>
          <div class="pat-item-val teal">{{ ars(store.totalAhorros) }}</div>
        </div>
      </div>
    </div>

    <!-- Bancos -->
    <div class="section-header">
      <span class="section-title">Bancos</span>
      <span class="section-total">{{ ars(store.totalBancos) }}</span>
    </div>
    <div class="cuenta-list">
      <div v-for="c in store.cuentas" :key="c.id" class="cuenta-card">
        <div class="cuenta-avatar">{{ c.nombre[0] }}</div>
        <div class="cuenta-info">
          <div class="cuenta-nombre">{{ c.nombre }}</div>
          <div class="cuenta-usd">{{ usd(parseFloat(c.saldo) / dolar.valorPreferido) }}</div>
        </div>
        <div class="cuenta-right">
          <div class="cuenta-saldo">{{ ars(c.saldo) }}</div>
          <button class="btn-editar" @click="abrirEditar(c, 'cuenta')">Editar saldo</button>
        </div>
      </div>
    </div>

    <!-- Ahorros -->
    <div class="section-header" style="margin-top: 20px">
      <span class="section-title">Ahorros</span>
      <span class="section-total teal">{{ ars(store.totalAhorros) }}</span>
    </div>
    <div class="bucket-grid">
      <div v-for="b in store.buckets" :key="b.id" class="bucket-card" @click="abrirEditar(b, 'bucket')">
        <div class="bucket-top">
          <span class="bucket-dot"></span>
          <span class="bucket-nombre">{{ b.nombre }}</span>
        </div>
        <div class="bucket-monto" :class="parseFloat(b.monto) > 0 ? '' : 'muted'">{{ ars(b.monto) }}</div>
        <div v-if="parseFloat(b.monto) === 0" class="bucket-empty">sin fondos</div>
        <div v-else class="bucket-usd">{{ usd(parseFloat(b.monto) / dolar.valorPreferido) }}</div>
      </div>
    </div>

    <!-- Modal editar saldo -->
    <div v-if="modal" class="modal-overlay" @click.self="modal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar {{ editandoTipo === 'cuenta' ? 'saldo' : 'monto' }}</h2>
          <button @click="modal = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="guardar" style="display:flex;flex-direction:column;gap:14px">
          <div class="field">
            <label>{{ editandoItem?.nombre }}</label>
            <input v-model="nuevoMonto" type="number" min="0" step="0.01" required />
          </div>
          <button type="submit" class="btn-guardar">Guardar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCuentasStore } from '@/stores/cuentas';
import { useDolarStore } from '@/stores/dolar';
import { useAuthStore } from '@/stores/auth';
import { ars, usd } from '@/lib/format';

const store = useCuentasStore();
const dolar = useDolarStore();
const auth = useAuthStore();
const modal = ref(false);
const editandoItem = ref<any>(null);
const editandoTipo = ref<'cuenta' | 'bucket'>('cuenta');
const nuevoMonto = ref('');

const prefLabel = computed(() => ({ oficial: 'Oficial', mep: 'MEP', blue: 'Blue' }[auth.usuario?.dolarPref ?? 'blue'] ?? 'Blue'));

function abrirEditar(item: any, tipo: 'cuenta' | 'bucket') {
  editandoItem.value = item;
  editandoTipo.value = tipo;
  nuevoMonto.value = String(parseFloat(tipo === 'cuenta' ? item.saldo : item.monto));
  modal.value = true;
}

async function guardar() {
  if (editandoTipo.value === 'cuenta') {
    await store.patchCuenta(editandoItem.value.id, { saldo: nuevoMonto.value });
  } else {
    await store.patchBucket(editandoItem.value.id, { monto: nuevoMonto.value });
  }
  modal.value = false;
}

onMounted(() => { store.cargar(); dolar.cargar(); });
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-sub { font-size: 11px; color: #94A3B8; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; }
.avatar { width: 38px; height: 38px; border-radius: 50%; background: #EEF0FE; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; font-family: 'Space Grotesk', sans-serif; }

.patrimonio-card { background: #0F172A; border-radius: 18px; padding: 18px; margin-bottom: 20px; color: #fff; }
.pat-label { font-size: 11.5px; color: #94A3B8; }
.pat-val { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 28px; letter-spacing: -0.02em; margin-top: 3px; }
.pat-usd { font-size: 12px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
.pat-row { display: flex; gap: 10px; margin-top: 14px; }
.pat-item { flex: 1; background: rgba(255,255,255,.06); border-radius: 12px; padding: 10px 12px; }
.pat-item-label { font-size: 10.5px; color: #94A3B8; }
.pat-item-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: #fff; margin-top: 2px; }
.pat-item-val.teal { color: #5EEAD4; }

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
.section-title { font-size: 13px; font-weight: 600; color: #0F172A; }
.section-total { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #475569; }
.section-total.teal { color: #0D9488; }

.cuenta-list { display: flex; flex-direction: column; gap: 10px; }
.cuenta-card { background: #fff; border: 1px solid #E6E9EF; border-radius: 16px; padding: 14px; display: flex; align-items: center; gap: 12px; }
.cuenta-avatar { width: 40px; height: 40px; border-radius: 11px; background: #EEF0FE; color: #4F46E5; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; font-family: 'Space Grotesk', sans-serif; flex: none; }
.cuenta-info { flex: 1; min-width: 0; }
.cuenta-nombre { font-size: 13.5px; font-weight: 600; color: #0F172A; }
.cuenta-usd { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; }
.cuenta-right { text-align: right; }
.cuenta-saldo { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #0F172A; }
.btn-editar { font-size: 10.5px; color: #4F46E5; font-weight: 600; background: none; border: none; cursor: pointer; margin-top: 2px; padding: 0; }

.bucket-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.bucket-card { background: #fff; border: 1px solid #E6E9EF; border-radius: 16px; padding: 14px; cursor: pointer; }
.bucket-top { display: flex; align-items: center; gap: 7px; margin-bottom: 8px; }
.bucket-dot { width: 9px; height: 9px; border-radius: 3px; background: #0D9488; }
.bucket-nombre { font-size: 12px; font-weight: 600; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bucket-monto { font-family: 'JetBrains Mono', monospace; font-size: 15px; font-weight: 600; color: #0F172A; }
.bucket-monto.muted { color: #CBD5E1; }
.bucket-empty { font-size: 10px; color: #CBD5E1; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }
.bucket-usd { font-size: 10px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; margin-top: 2px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 18px; color: #0F172A; }
.btn-cerrar { background: none; border: none; color: #94A3B8; font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: #475569; }
.field input { padding: 10px 12px; border: 1px solid #E6E9EF; border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.btn-guardar { padding: 12px; background: #4F46E5; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
