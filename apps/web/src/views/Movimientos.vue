<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas · {{ mesLabel(store.mes) }}</div>
        <h1 class="page-title">Movimientos</h1>
      </div>
      <button class="btn-nuevo" @click="abrirNuevo">+ Nuevo</button>
    </header>

    <!-- Selector de mes -->
    <div class="mes-tabs">
      <button v-for="m in mesesDisponibles" :key="m" class="mes-tab" :class="{ active: store.mes === m }" @click="cambiarMes(m)">
        {{ mesLabel(m) }}
      </button>
    </div>

    <!-- Totales -->
    <div class="totales" v-if="store.resumen">
      <div class="total-card">
        <div class="tc-label">Ingresos</div>
        <div class="tc-val green">{{ ars(store.resumen.ingresos) }}</div>
      </div>
      <div class="total-card">
        <div class="tc-label">Gastos</div>
        <div class="tc-val red">{{ ars(store.resumen.gastos) }}</div>
      </div>
      <div class="total-card dark">
        <div class="tc-label">Balance</div>
        <div class="tc-val">{{ ars(store.resumen.balance) }}</div>
      </div>
    </div>

    <!-- Filtros -->
    <div class="filtros">
      <button class="filtro" :class="{ active: filtroTipo === '' }" @click="filtroTipo = ''">Todos</button>
      <button class="filtro green" :class="{ active: filtroTipo === 'ingreso' }" @click="filtroTipo = 'ingreso'">Ingresos</button>
      <button class="filtro red" :class="{ active: filtroTipo === 'gasto' }" @click="filtroTipo = 'gasto'">Gastos</button>
    </div>

    <!-- Lista agrupada por día -->
    <div v-if="store.cargando" class="loading">Cargando...</div>
    <div v-else-if="!store.items.length" class="empty">
      <p>No hay movimientos en este período.</p>
      <button class="btn-nuevo" @click="abrirNuevo">Registrar el primero</button>
    </div>
    <div v-else class="grupos">
      <div v-for="(items, dia) in agrupadosPorDia" :key="dia" class="grupo">
        <div class="grupo-fecha">{{ formatDia(String(dia)) }}</div>
        <div class="mov-list">
          <div v-for="m in items" :key="m.id" class="mov-row" :style="{ borderLeftColor: m.categoria?.color ?? (m.tipo === 'ingreso' ? '#16A34A' : '#94A3B8') }" @click="abrirEditar(m)">
            <div class="mov-info">
              <div class="mov-desc">{{ m.descripcion }}</div>
              <div class="mov-meta">
                <span class="dot-cat" :style="{ background: m.categoria?.color ?? (m.tipo === 'ingreso' ? '#16A34A' : '#94A3B8') }"></span>
                {{ m.categoria?.label ?? (m.tipo === 'ingreso' ? 'Ingreso' : 'Sin categoría') }} · {{ m.cuenta?.nombre }}
              </div>
            </div>
            <span class="mov-monto" :class="m.tipo === 'ingreso' ? 'green' : 'red'">
              {{ m.tipo === 'ingreso' ? '+' : '−' }}{{ ars(m.monto) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal nuevo/editar -->
    <div v-if="modal" class="modal-overlay" @click.self="cerrarModal">
      <div class="modal">
        <div class="modal-header">
          <h2>{{ editando ? 'Editar movimiento' : 'Nuevo movimiento' }}</h2>
          <button @click="cerrarModal" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="guardar" class="modal-form">
          <div class="field">
            <label>Tipo</label>
            <div class="tipo-tabs">
              <button type="button" :class="['tipo-tab', form.tipo === 'gasto' ? 'active-red' : '']" @click="form.tipo = 'gasto'">Gasto</button>
              <button type="button" :class="['tipo-tab', form.tipo === 'ingreso' ? 'active-green' : '']" @click="form.tipo = 'ingreso'">Ingreso</button>
            </div>
          </div>
          <div class="field">
            <label>Descripción</label>
            <input v-model="form.descripcion" required placeholder="¿En qué?" />
          </div>
          <div class="field">
            <label>Monto</label>
            <input v-model="form.monto" type="number" min="0" step="0.01" required placeholder="0.00" />
          </div>
          <div class="field">
            <label>Fecha</label>
            <input v-model="form.fecha" type="date" required />
          </div>
          <div class="field" v-if="form.tipo === 'gasto'">
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
          <p v-if="error" class="error-msg">{{ error }}</p>
          <div class="modal-actions">
            <button v-if="editando" type="button" @click="eliminar" class="btn-eliminar">Eliminar</button>
            <button type="submit" class="btn-guardar">{{ editando ? 'Guardar' : 'Agregar' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useMovimientosStore } from '@/stores/movimientos';
import { useCuentasStore } from '@/stores/cuentas';
import { http } from '@/lib/http';
import { ars, mesLabel, mesActual, fecha } from '@/lib/format';

const store = useMovimientosStore();
const cuentasStore = useCuentasStore();
const categorias = ref<any[]>([]);
const filtroTipo = ref('');
const modal = ref(false);
const editando = ref<any>(null);
const error = ref('');

const form = ref({ tipo: 'gasto', descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0], categoriaId: '', cuentaId: '' });

const mesesDisponibles = computed(() => {
  const hoy = new Date();
  const meses = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    meses.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return meses;
});

const filtrados = computed(() =>
  filtroTipo.value ? store.items.filter(m => m.tipo === filtroTipo.value) : store.items,
);

const agrupadosPorDia = computed(() => {
  const grupos: Record<string, any[]> = {};
  for (const m of filtrados.value) {
    const d = m.fecha;
    if (!grupos[d]) grupos[d] = [];
    grupos[d].push(m);
  }
  return grupos;
});

function formatDia(d: string) {
  const dias = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
  const dt = new Date(d + 'T00:00:00');
  return `${dias[dt.getDay()]} ${fecha(d)}`;
}

async function cambiarMes(m: string) {
  store.mes = m;
  await Promise.all([store.cargar({ tipo: filtroTipo.value || undefined }), store.cargarResumen()]);
}

function abrirNuevo() {
  editando.value = null;
  form.value = { tipo: 'gasto', descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0], categoriaId: '', cuentaId: String(cuentasStore.cuentas[0]?.id ?? '') };
  modal.value = true;
}

function abrirEditar(m: any) {
  editando.value = m;
  form.value = { tipo: m.tipo, descripcion: m.descripcion, monto: String(parseFloat(m.monto)), fecha: m.fecha, categoriaId: String(m.categoriaId ?? ''), cuentaId: String(m.cuentaId) };
  modal.value = true;
}

function cerrarModal() { modal.value = false; error.value = ''; }

async function guardar() {
  error.value = '';
  const data = { ...form.value, monto: form.value.monto, categoriaId: form.value.categoriaId ? +form.value.categoriaId : null, cuentaId: +form.value.cuentaId };
  try {
    if (editando.value) await store.actualizar(editando.value.id, data);
    else await store.crear(data);
    cerrarModal();
    await store.cargarResumen();
  } catch (e: any) { error.value = e.message; }
}

async function eliminar() {
  if (!editando.value) return;
  await store.eliminar(editando.value.id);
  cerrarModal();
  await store.cargarResumen();
}

onMounted(async () => {
  await Promise.all([
    store.cargar(),
    store.cargarResumen(),
    cuentasStore.cargar(),
    http.get<any[]>('/categorias').then(r => categorias.value = r),
  ]);
});

watch(filtroTipo, () => store.cargar({ tipo: filtroTipo.value || undefined }));
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
.page-sub { font-size: 11px; color: #94A3B8; }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: #0F172A; }
.btn-nuevo { background: #4F46E5; color: #fff; border: none; border-radius: 12px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }

.mes-tabs { display: flex; background: #F6F7F9; border-radius: 999px; padding: 3px; gap: 2px; margin-bottom: 14px; overflow-x: auto; }
.mes-tab { flex: 1; text-align: center; font-size: 11.5px; font-weight: 500; color: #94A3B8; padding: 6px 0; border: none; background: none; border-radius: 999px; cursor: pointer; white-space: nowrap; }
.mes-tab.active { background: #4F46E5; color: #fff; font-weight: 600; }

.totales { display: flex; gap: 9px; margin-bottom: 14px; }
.total-card { flex: 1; background: #fff; border: 1px solid #E6E9EF; border-radius: 14px; padding: 11px; }
.total-card.dark { background: #0F172A; border-color: #0F172A; }
.tc-label { font-size: 10.5px; color: #475569; margin-bottom: 3px; }
.total-card.dark .tc-label { color: #94A3B8; }
.tc-val { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.total-card.dark .tc-val { color: #fff; }
.tc-val.green { color: #16A34A; }
.tc-val.red { color: #E11D48; }

.filtros { display: flex; gap: 7px; margin-bottom: 16px; overflow: hidden; }
.filtro { font-size: 11.5px; font-weight: 600; padding: 6px 12px; border-radius: 999px; border: none; cursor: pointer; background: #F1F5F9; color: #475569; }
.filtro.active { background: #4F46E5; color: #fff; }
.filtro.green.active { background: #E7F6EC; color: #16A34A; }
.filtro.red.active { background: #FCE8EC; color: #E11D48; }

.loading, .empty { text-align: center; color: #94A3B8; padding: 40px 0; }

.grupos { display: flex; flex-direction: column; gap: 18px; }
.grupo-fecha { font-size: 11px; font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: #94A3B8; margin-bottom: 8px; }
.mov-list { background: #fff; border: 1px solid #E6E9EF; border-radius: 14px; overflow: hidden; }
.mov-row { display: flex; align-items: center; gap: 11px; padding: 11px 13px; border-bottom: 1px solid #F1F5F9; border-left: 3px solid #94A3B8; cursor: pointer; transition: background 0.1s; }
.mov-row:hover { background: #FBFCFD; }
.mov-row:last-child { border-bottom: none; }
.mov-info { flex: 1; min-width: 0; }
.mov-desc { font-size: 13px; font-weight: 600; color: #0F172A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mov-meta { font-size: 11px; color: #94A3B8; display: flex; align-items: center; gap: 6px; margin-top: 2px; }
.dot-cat { width: 6px; height: 6px; border-radius: 50%; flex: none; }
.mov-monto { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; flex: none; }
.mov-monto.green { color: #16A34A; }
.mov-monto.red { color: #E11D48; }

/* Modal */
.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
@media (min-width: 480px) { .modal-overlay { align-items: center; } }
.modal { background: #fff; border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
@media (min-width: 480px) { .modal { border-radius: 20px; } }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 18px; color: #0F172A; }
.btn-cerrar { background: none; border: none; color: #94A3B8; font-size: 18px; cursor: pointer; }
.modal-form { display: flex; flex-direction: column; gap: 14px; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: #475569; }
.field input, .field select { padding: 10px 12px; border: 1px solid #E6E9EF; border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; color: #0F172A; background: #fff; outline: none; }
.field input:focus, .field select:focus { border-color: #4F46E5; }
.tipo-tabs { display: flex; gap: 8px; }
.tipo-tab { flex: 1; padding: 9px; border: 1px solid #E6E9EF; border-radius: 10px; background: #F6F7F9; color: #475569; font-weight: 500; cursor: pointer; font-size: 13px; }
.tipo-tab.active-red { background: #FCE8EC; color: #E11D48; border-color: #E11D48; font-weight: 600; }
.tipo-tab.active-green { background: #E7F6EC; color: #16A34A; border-color: #16A34A; font-weight: 600; }
.error-msg { font-size: 12.5px; color: #E11D48; background: #FCE8EC; padding: 8px 12px; border-radius: 8px; }
.modal-actions { display: flex; gap: 10px; margin-top: 4px; }
.btn-guardar { flex: 1; padding: 12px; background: #4F46E5; color: #fff; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
.btn-eliminar { padding: 12px 16px; background: #FCE8EC; color: #E11D48; border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
