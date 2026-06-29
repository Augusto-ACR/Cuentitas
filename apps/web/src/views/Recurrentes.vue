<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Gastos fijos</h1>
      </div>
      <button class="btn-nuevo" @click="abrirNuevo">+ Nuevo</button>
    </header>

    <p class="intro">Plantillas de gastos que se repiten. Tocá <strong>Cargar</strong> y se anota como un movimiento del mes (descontando de la cuenta).</p>

    <div v-if="!store.items.length" class="empty">
      <p>No tenés gastos fijos todavía.</p>
      <button class="btn-nuevo" @click="abrirNuevo">Crear el primero</button>
    </div>

    <div class="rec-list">
      <div v-for="r in store.items" :key="r.id" class="rec-card" :style="{ borderLeftColor: r.categoria?.color ?? '#94A3B8' }">
        <div class="rec-top">
          <span class="rec-avatar" :style="{ background: r.categoria?.color ?? '#94A3B8' }">{{ r.nombre[0] }}</span>
          <div class="rec-info">
            <div class="rec-nombre">{{ r.nombre }}</div>
            <div class="rec-meta">{{ r.categoria?.label ?? 'Sin categoría' }} · {{ r.cuenta?.nombre }} · día {{ r.diaAprox }}</div>
          </div>
          <div class="rec-monto">{{ ars(r.montoEstimado) }}</div>
        </div>
        <div class="rec-footer">
          <div class="rec-acciones">
            <button class="btn-link" @click="abrirEditar(r)">Editar</button>
            <button class="btn-link danger" @click="eliminarRec(r)">Eliminar</button>
          </div>
          <button class="btn-cargar" @click="abrirCargar(r)">Cargar este mes</button>
        </div>
      </div>
    </div>

    <!-- Modal crear/editar -->
    <div v-if="modal" class="modal-overlay" @click.self="modal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editando ? 'Editar gasto fijo' : 'Nuevo gasto fijo' }}</h2>
          <button @click="modal = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="guardar" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Nombre</label><input v-model="form.nombre" required placeholder="Ej: Alquiler, Netflix" /></div>
          <div class="field">
            <label>Categoría</label>
            <select v-model="form.categoriaId">
              <option value="">Sin categoría</option>
              <option v-for="c in categorias" :key="c.id" :value="c.id">{{ c.label }}</option>
            </select>
          </div>
          <div class="field">
            <label>Cuenta</label>
            <select v-model="form.cuentaId" required>
              <option v-for="c in cuentasStore.cuentas" :key="c.id" :value="c.id">{{ c.nombre }}</option>
            </select>
          </div>
          <div class="field"><label>Día aproximado del mes</label><input v-model="form.diaAprox" type="number" min="1" max="31" required /></div>
          <div class="field"><label>Monto habitual</label><input v-model="form.montoEstimado" type="number" min="0" step="0.01" required /></div>
          <button type="submit" class="btn-guardar">{{ editando ? 'Guardar' : 'Crear' }}</button>
        </form>
      </div>
    </div>

    <!-- Modal cargar este mes -->
    <div v-if="modalCargar" class="modal-overlay" @click.self="modalCargar = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Cargar {{ cargandoRec?.nombre }}</h2>
          <button @click="modalCargar = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="confirmarCargar" style="display:flex;flex-direction:column;gap:14px">
          <p class="intro" style="margin:0">Revisá el monto real de este mes (los precios cambian). Se va a anotar como un gasto en {{ cargandoRec?.cuenta?.nombre }}.</p>
          <div class="field"><label>Monto de este mes</label><input v-model="formCargar.monto" type="number" min="0" step="0.01" required /></div>
          <div class="field"><label>Fecha</label><input v-model="formCargar.fecha" type="date" required /></div>
          <button type="submit" class="btn-cargar full">Cargar como gasto</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRecurrentesStore } from '@/stores/recurrentes';
import { useCuentasStore } from '@/stores/cuentas';
import { useMovimientosStore } from '@/stores/movimientos';
import { http } from '@/lib/http';
import { ars } from '@/lib/format';

const store = useRecurrentesStore();
const cuentasStore = useCuentasStore();
const movStore = useMovimientosStore();
const categorias = ref<any[]>([]);

const modal = ref(false);
const editando = ref<any>(null);
const form = ref({ nombre: '', categoriaId: '' as any, cuentaId: '' as any, diaAprox: '1', montoEstimado: '' });

const modalCargar = ref(false);
const cargandoRec = ref<any>(null);
const formCargar = ref({ monto: '', fecha: '' });

function fechaSugerida(dia: number): string {
  const hoy = new Date();
  const ultimoDia = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
  const d = Math.min(dia || 1, ultimoDia);
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function abrirNuevo() {
  editando.value = null;
  form.value = { nombre: '', categoriaId: '', cuentaId: String(cuentasStore.cuentas[0]?.id ?? ''), diaAprox: '1', montoEstimado: '' };
  modal.value = true;
}

function abrirEditar(r: any) {
  editando.value = r;
  form.value = {
    nombre: r.nombre,
    categoriaId: r.categoriaId ?? '',
    cuentaId: r.cuentaId,
    diaAprox: String(r.diaAprox),
    montoEstimado: String(parseFloat(r.montoEstimado)),
  };
  modal.value = true;
}

async function guardar() {
  const data = {
    nombre: form.value.nombre,
    categoriaId: form.value.categoriaId ? +form.value.categoriaId : null,
    cuentaId: +form.value.cuentaId,
    diaAprox: +form.value.diaAprox,
    montoEstimado: String(form.value.montoEstimado),
  };
  if (editando.value) await store.actualizar(editando.value.id, data);
  else await store.crear(data);
  modal.value = false;
}

async function eliminarRec(r: any) {
  if (!confirm(`¿Eliminar el gasto fijo "${r.nombre}"? (no borra los movimientos ya cargados)`)) return;
  await store.eliminar(r.id);
}

function abrirCargar(r: any) {
  cargandoRec.value = r;
  formCargar.value = { monto: String(parseFloat(r.montoEstimado)), fecha: fechaSugerida(r.diaAprox) };
  modalCargar.value = true;
}

async function confirmarCargar() {
  await store.cargarMes(cargandoRec.value.id, parseFloat(formCargar.value.monto), formCargar.value.fecha);
  modalCargar.value = false;
  await Promise.all([cuentasStore.cargar(), movStore.cargarResumen()]);
}

onMounted(() => {
  store.cargar();
  cuentasStore.cargar();
  http.get<any[]>('/categorias').then(r => (categorias.value = r));
});
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
.page-sub { font-size: 11px; color: #94A3B8; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; }
.btn-nuevo { background: #4F46E5; color: #fff; border: none; border-radius: 12px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }
.intro { font-size: 12.5px; color: #94A3B8; line-height: 1.5; margin-bottom: 16px; }
.empty { text-align: center; color: #94A3B8; padding: 40px 0; display: flex; flex-direction: column; align-items: center; gap: 12px; }

.rec-list { display: flex; flex-direction: column; gap: 11px; }
.rec-card { background: #fff; border: 1px solid #E6E9EF; border-left: 3px solid #94A3B8; border-radius: 15px; padding: 13px; }
.rec-top { display: flex; align-items: center; gap: 12px; }
.rec-avatar { width: 38px; height: 38px; border-radius: 10px; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; font-family: 'Space Grotesk', sans-serif; flex: none; }
.rec-info { flex: 1; min-width: 0; }
.rec-nombre { font-size: 13.5px; font-weight: 600; color: #0F172A; }
.rec-meta { font-size: 11px; color: #94A3B8; margin-top: 2px; }
.rec-monto { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: #0F172A; flex: none; }
.rec-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 11px; padding-top: 10px; border-top: 1px solid #F1F5F9; }
.rec-acciones { display: flex; align-items: center; gap: 14px; }
.btn-link { font-size: 11.5px; font-weight: 600; color: #475569; background: none; border: none; cursor: pointer; padding: 0; }
.btn-link.danger { color: #E11D48; }
.btn-cargar { background: #0D9488; color: #fff; border: none; border-radius: 10px; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; }
.btn-cargar.full { width: 100%; padding: 12px; font-size: 14px; border-radius: 12px; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 17px; color: #0F172A; }
.btn-cerrar { background: none; border: none; color: #94A3B8; font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: #475569; }
.field input, .field select { padding: 10px 12px; border: 1px solid #E6E9EF; border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.btn-guardar { padding: 12px; background: #4F46E5; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
