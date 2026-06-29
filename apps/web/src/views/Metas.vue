<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Metas y ahorros</h1>
      </div>
      <button class="btn-nuevo" @click="abrirNueva">+ Nueva</button>
    </header>

    <div v-if="!store.items.length" class="empty">
      <p>No tenés metas ni ahorros todavía.</p>
      <button class="btn-nuevo" @click="abrirNueva">Crear el primero</button>
    </div>

    <div v-for="meta in store.items" :key="meta.id" class="meta-card" :class="meta.tipo === 'compartida' ? 'compartida' : ''">
      <div class="meta-top">
        <div class="meta-icon" :class="meta.tipo === 'compartida' ? 'teal' : 'primary'">
          <svg v-if="meta.tipo === 'compartida'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="9" r="2.8"/><circle cx="16" cy="9.5" r="2.4"/><path d="M3.5 18c0-2.6 2.2-4 5-4s5 1.4 5 4M14.5 18c0-1.9 1-3.2 3-3.5"/></svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></svg>
        </div>
        <div>
          <div class="meta-titulo">{{ meta.titulo }}</div>
          <div class="meta-sub" v-if="tieneObjetivo(meta)">Objetivo {{ usd(meta.objetivo) }} · {{ meta.plazoMeses }} meses</div>
          <div class="meta-sub" v-else>Ahorro libre · sin objetivo fijo</div>
        </div>
        <div class="meta-tipo-badge" v-if="meta.tipo === 'compartida'">Compartida</div>
      </div>

      <!-- Con objetivo: progreso completo -->
      <div class="meta-progress" v-if="tieneObjetivo(meta)">
        <div class="meta-row">
          <div>
            <div class="meta-val-label">Llevás ahorrado</div>
            <div class="meta-val">{{ usd(progresoUsd(meta)) }}</div>
          </div>
          <div style="text-align:right">
            <div class="meta-val-label">Te falta</div>
            <div class="meta-val teal">{{ usd(Math.max(0, meta.objetivo - progresoUsd(meta))) }}</div>
          </div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: Math.min(100, (progresoUsd(meta) / meta.objetivo) * 100) + '%' }"></div>
        </div>
        <div class="meta-pct">{{ ((progresoUsd(meta) / meta.objetivo) * 100).toFixed(1) }}% del objetivo · {{ ars(totalARS(meta)) }} aportados</div>
      </div>

      <!-- Sin objetivo: solo acumulado -->
      <div class="meta-progress" v-else>
        <div class="meta-val-label">Llevás ahorrado</div>
        <div class="meta-val">{{ usd(progresoUsd(meta)) }}</div>
        <div class="meta-pct">{{ ars(totalARS(meta)) }} aportados</div>
      </div>

      <!-- Aporte sugerido (solo con objetivo y plazo) -->
      <div class="aporte-sugerido" v-if="tieneObjetivo(meta) && meta.objetivo > progresoUsd(meta) && meta.plazoMeses">
        <div class="as-title">Aporte sugerido</div>
        <div class="as-body">Para llegar en {{ meta.plazoMeses }} meses, guardá <strong>{{ usd((meta.objetivo - progresoUsd(meta)) / meta.plazoMeses) }}</strong> por mes.</div>
      </div>

      <!-- Aportes -->
      <div class="aportes-section">
        <div class="aportes-header">
          <span class="aportes-title">Aportes</span>
          <button class="btn-aporte" @click="abrirAporte(meta)">+ Registrar</button>
        </div>
        <div v-if="!meta.aportes?.length" class="aportes-empty">Todavía no hay aportes.</div>
        <div v-else class="aportes-list">
          <div v-for="a in meta.aportes" :key="a.id" class="aporte-row">
            <span class="aporte-fecha">{{ fecha(a.fecha) }}</span>
            <span class="aporte-usuario">{{ a.usuario?.nombre ?? '' }}</span>
            <span class="aporte-monto">{{ ars(a.montoARS) }}</span>
          </div>
        </div>
      </div>

      <!-- Participantes (compartida) -->
      <div v-if="meta.tipo === 'compartida' && meta.participantes?.length" class="participantes">
        <span v-for="p in meta.participantes" :key="p.id" class="part-chip">{{ p.usuario?.nombre ?? p.usuarioId }}</span>
      </div>
    </div>

    <!-- Modal nueva meta/ahorro -->
    <div v-if="modalNueva" class="modal-overlay" @click.self="modalNueva = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Nueva meta o ahorro</h2>
          <button @click="modalNueva = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="crearMeta" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Título</label><input v-model="formMeta.titulo" required placeholder="Ej: Viaje, Notebook, Emergencias" /></div>

          <label class="check-row">
            <input type="checkbox" v-model="formMeta.sinObjetivo" />
            <span>Es un ahorro libre (sin objetivo fijo)</span>
          </label>

          <template v-if="!formMeta.sinObjetivo">
            <div class="field"><label>Objetivo (USD)</label><input v-model="formMeta.objetivoUSD" type="number" min="1" required /></div>
            <div class="field"><label>Plazo (meses)</label><input v-model="formMeta.plazoMeses" type="number" min="1" required /></div>
          </template>

          <div class="field">
            <label>Tipo</label>
            <select v-model="formMeta.tipo">
              <option value="personal">Personal</option>
              <option value="compartida">Compartida</option>
            </select>
          </div>
          <button type="submit" class="btn-guardar">Crear</button>
        </form>
      </div>
    </div>

    <!-- Modal aporte -->
    <div v-if="modalAporte" class="modal-overlay" @click.self="modalAporte = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Registrar aporte · {{ aportandoMeta?.titulo }}</h2>
          <button @click="modalAporte = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="agregarAporte" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Monto (ARS)</label><input v-model="formAporte.montoARS" type="number" min="1" required /></div>
          <div class="field">
            <label>Sale de la cuenta</label>
            <select v-model="formAporte.cuentaId" required>
              <option v-for="c in cuentasStore.cuentas" :key="c.id" :value="String(c.id)">{{ c.nombre }} — {{ ars(c.saldo) }}</option>
            </select>
            <span class="field-hint">El monto se descuenta de esta cuenta.</span>
          </div>
          <div class="field"><label>Fecha</label><input v-model="formAporte.fecha" type="date" required /></div>
          <button type="submit" class="btn-guardar">Registrar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useMetasStore } from '@/stores/metas';
import { useDolarStore } from '@/stores/dolar';
import { useAuthStore } from '@/stores/auth';
import { useCuentasStore } from '@/stores/cuentas';
import { ars, usd, fecha } from '@/lib/format';

const store = useMetasStore();
const dolar = useDolarStore();
const auth = useAuthStore();
const cuentasStore = useCuentasStore();

const modalNueva = ref(false);
const modalAporte = ref(false);
const aportandoMeta = ref<any>(null);
const formMeta = ref({ titulo: '', objetivoUSD: '', plazoMeses: '', tipo: 'personal', sinObjetivo: false });
const hoy = () => new Date().toISOString().split('T')[0];
const formAporte = ref({ montoARS: '', fecha: hoy(), cuentaId: '' });

function tieneObjetivo(meta: any): boolean {
  return meta.objetivo != null;
}

function progresoUsd(meta: any): number {
  const pref = auth.usuario?.dolarPref ?? 'blue';
  return meta.progreso?.[pref] ?? 0;
}

function totalARS(meta: any): number {
  return (meta.aportes ?? []).reduce((a: number, x: any) => a + parseFloat(x.montoARS), 0);
}

function abrirNueva() {
  formMeta.value = { titulo: '', objetivoUSD: '', plazoMeses: '', tipo: 'personal', sinObjetivo: false };
  modalNueva.value = true;
}

function abrirAporte(meta: any) {
  aportandoMeta.value = meta;
  formAporte.value = { montoARS: '', fecha: hoy(), cuentaId: String(cuentasStore.cuentas[0]?.id ?? '') };
  modalAporte.value = true;
}

async function crearMeta() {
  const payload: any = { titulo: formMeta.value.titulo, tipo: formMeta.value.tipo };
  if (!formMeta.value.sinObjetivo) {
    payload.objetivoUSD = parseFloat(formMeta.value.objetivoUSD);
    payload.plazoMeses = parseInt(formMeta.value.plazoMeses);
  }
  await store.crear(payload);
  modalNueva.value = false;
}

async function agregarAporte() {
  await store.agregarAporte(
    aportandoMeta.value.id,
    parseFloat(formAporte.value.montoARS),
    formAporte.value.fecha,
    parseInt(formAporte.value.cuentaId),
  );
  modalAporte.value = false;
  await cuentasStore.cargar();
}

onMounted(() => { store.cargar(); dolar.cargar(); cuentasStore.cargar(); });
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-sub { font-size: 11px; color: #94A3B8; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; }
.btn-nuevo { background: #4F46E5; color: #fff; border: none; border-radius: 12px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
.empty { text-align: center; color: #94A3B8; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.meta-card { background: #fff; border: 1px solid #E6E9EF; border-radius: 18px; padding: 18px; margin-bottom: 14px; }
.meta-card.compartida { background: linear-gradient(150deg, #0D9488, #0F766E); border: none; color: #fff; }
.meta-top { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
.meta-icon { width: 38px; height: 38px; border-radius: 11px; display: flex; align-items: center; justify-content: center; flex: none; }
.meta-icon.teal { background: rgba(255,255,255,.2); color: #fff; }
.meta-icon.primary { background: #E3F4F1; color: #0D9488; }
.meta-titulo { font-size: 14px; font-weight: 600; color: inherit; }
.meta-sub { font-size: 11.5px; color: #94A3B8; }
.meta-card.compartida .meta-sub { color: #A7F3D0; }
.meta-tipo-badge { margin-left: auto; font-size: 11px; font-weight: 600; background: rgba(255,255,255,.2); color: #fff; padding: 4px 10px; border-radius: 999px; flex: none; }

.meta-row { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 8px; }
.meta-val-label { font-size: 11px; color: #475569; }
.meta-card.compartida .meta-val-label { color: #A7F3D0; }
.meta-val { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; margin-top: 1px; }
.meta-card.compartida .meta-val { color: #fff; }
.meta-val.teal { color: #0D9488; }
.meta-card.compartida .meta-val.teal { color: #fff; }
.progress-bar { height: 10px; border-radius: 999px; background: #E3F4F1; overflow: hidden; margin: 6px 0; }
.meta-card.compartida .progress-bar { background: rgba(255,255,255,.22); }
.progress-fill { height: 100%; background: #0D9488; border-radius: 999px; transition: width 0.5s; }
.meta-card.compartida .progress-fill { background: #fff; }
.meta-pct { font-size: 11px; color: #94A3B8; font-family: 'JetBrains Mono', monospace; margin-top: 4px; }
.meta-card.compartida .meta-pct { color: #A7F3D0; }

.aporte-sugerido { background: #EEF0FE; border: 1px solid #E0E3FB; border-radius: 13px; padding: 12px 14px; margin-top: 14px; }
.meta-card.compartida .aporte-sugerido { background: rgba(255,255,255,.12); border-color: transparent; }
.as-title { font-size: 12px; font-weight: 600; color: #4F46E5; margin-bottom: 4px; }
.meta-card.compartida .as-title { color: #fff; }
.as-body { font-size: 12.5px; color: #475569; line-height: 1.5; }
.meta-card.compartida .as-body { color: rgba(255,255,255,.85); }

.aportes-section { margin-top: 14px; padding-top: 14px; border-top: 1px solid #EEF1F5; }
.meta-card.compartida .aportes-section { border-top-color: rgba(255,255,255,.2); }
.aportes-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
.aportes-title { font-size: 13px; font-weight: 600; color: #0F172A; }
.meta-card.compartida .aportes-title { color: #fff; }
.btn-aporte { font-size: 12px; color: #4F46E5; font-weight: 600; background: none; border: none; cursor: pointer; }
.meta-card.compartida .btn-aporte { color: #A7F3D0; }
.aportes-empty { font-size: 12px; color: #94A3B8; }
.aportes-list { display: flex; flex-direction: column; gap: 8px; }
.aporte-row { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.aporte-fecha { font-family: 'JetBrains Mono', monospace; color: #94A3B8; }
.aporte-usuario { flex: 1; color: #475569; }
.meta-card.compartida .aporte-usuario { color: #D1FAE5; }
.aporte-monto { font-family: 'JetBrains Mono', monospace; font-weight: 600; color: #0F172A; }
.meta-card.compartida .aporte-monto { color: #fff; }

.participantes { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.2); }
.part-chip { background: rgba(255,255,255,.2); color: #fff; padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 500; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 17px; color: #0F172A; }
.btn-cerrar { background: none; border: none; color: #94A3B8; font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: #475569; }
.field input, .field select { padding: 10px 12px; border: 1px solid #E6E9EF; border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.field-hint { font-size: 11px; color: #94A3B8; }
.check-row { display: flex; align-items: center; gap: 9px; font-size: 13px; color: #0F172A; cursor: pointer; }
.check-row input { width: 17px; height: 17px; accent-color: #4F46E5; }
.btn-guardar { padding: 12px; background: #4F46E5; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
