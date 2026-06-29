<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Cuentas</h1>
      </div>
      <div class="header-right">
        <button class="btn-nueva" @click="abrirNueva">+ Nueva</button>
        <div class="avatar" @click="irPerfil" role="button" tabindex="0">{{ auth.usuario?.nombre?.[0] }}</div>
      </div>
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
    <div v-if="!store.cuentas.length" class="empty-cuentas">
      <p class="empty-titulo">Todavía no tenés cuentas</p>
      <p class="empty-sub">Agregá tu primera cuenta (banco, billetera o efectivo) para empezar a registrar tu plata.</p>
      <button class="btn-nueva-grande" @click="abrirNueva">+ Crear mi primera cuenta</button>
    </div>
    <div v-else class="cuenta-list">
      <div v-for="c in store.cuentas" :key="c.id" class="cuenta-card">
        <div class="cuenta-avatar">{{ c.nombre[0] }}</div>
        <div class="cuenta-info">
          <div class="cuenta-nombre">{{ c.nombre }}</div>
          <div class="cuenta-usd">{{ usd(parseFloat(c.saldo) / dolar.valorPreferido) }}</div>
        </div>
        <div class="cuenta-right">
          <div class="cuenta-saldo">{{ ars(c.saldo) }}</div>
          <div class="cuenta-acciones">
            <button class="btn-editar" @click="abrirEditar(c)">Editar</button>
            <button class="btn-editar danger" @click="eliminarCuenta(c)">Borrar</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Ahorros (unificados en Metas) -->
    <div class="section-header" style="margin-top: 20px">
      <span class="section-title">Ahorros</span>
      <span class="section-total teal">{{ ars(store.totalAhorros) }}</span>
    </div>
    <RouterLink to="/metas" class="ahorros-card">
      <div>
        <div class="ahorros-title">Tus ahorros viven en Metas</div>
        <div class="ahorros-sub">Lo que aportás a una meta sale de tu cuenta y suma acá.</div>
      </div>
      <span class="ahorros-arrow">→</span>
    </RouterLink>

    <!-- Modal editar saldo de cuenta -->
    <div v-if="modal" class="modal-overlay" @click.self="modal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Editar saldo</h2>
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

    <!-- Modal nueva cuenta -->
    <div v-if="modalNueva" class="modal-overlay" @click.self="modalNueva = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Nueva cuenta</h2>
          <button @click="modalNueva = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="crearCuenta" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Nombre</label><input v-model="formNueva.nombre" required placeholder="Ej: Banco, Billetera, Efectivo" /></div>
          <div class="field"><label>Saldo actual</label><input v-model="formNueva.saldo" type="number" min="0" step="0.01" placeholder="0.00" /></div>
          <button type="submit" class="btn-guardar">Crear cuenta</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useCuentasStore } from '@/stores/cuentas';
import { useDolarStore } from '@/stores/dolar';
import { useAuthStore } from '@/stores/auth';
import { ars, usd } from '@/lib/format';

const store = useCuentasStore();
const dolar = useDolarStore();
const auth = useAuthStore();
const router = useRouter();
const modal = ref(false);
const editandoItem = ref<any>(null);
const nuevoMonto = ref('');

const prefLabel = computed(() => ({ oficial: 'Oficial', mep: 'MEP', blue: 'Blue' }[auth.usuario?.dolarPref ?? 'blue'] ?? 'Blue'));

function irPerfil() { router.push(auth.usuario?.rol === 'admin' ? '/admin' : '/ajustes'); }

function abrirEditar(item: any) {
  editandoItem.value = item;
  nuevoMonto.value = String(parseFloat(item.saldo));
  modal.value = true;
}

async function guardar() {
  await store.patchCuenta(editandoItem.value.id, { saldo: nuevoMonto.value });
  modal.value = false;
}

const modalNueva = ref(false);
const formNueva = ref({ nombre: '', saldo: '' });

function abrirNueva() {
  formNueva.value = { nombre: '', saldo: '' };
  modalNueva.value = true;
}

async function crearCuenta() {
  await store.crear({ nombre: formNueva.value.nombre, saldo: formNueva.value.saldo || '0' });
  modalNueva.value = false;
}

async function eliminarCuenta(c: any) {
  if (!confirm(`¿Eliminar la cuenta "${c.nombre}"?`)) return;
  try {
    await store.eliminar(c.id);
  } catch (e: any) {
    alert(e?.message ?? 'No se pudo eliminar la cuenta');
  }
}

onMounted(() => { store.cargar(); dolar.cargar(); });
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.page-sub { font-size: 11px; color: var(--text-muted); }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: var(--text); }
.avatar { width: 38px; height: 38px; border-radius: 50%; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 15px; font-family: 'Space Grotesk', sans-serif; cursor: pointer; }
.header-right { display: flex; align-items: center; gap: 10px; }
.btn-nueva { background: var(--primary); color: var(--surface); border: none; border-radius: 12px; padding: 9px 14px; font-size: 13px; font-weight: 600; cursor: pointer; }

.empty-cuentas { background: var(--surface); border: 1px dashed var(--border); border-radius: 16px; padding: 28px 20px; text-align: center; }
.empty-titulo { font-size: 14px; font-weight: 600; color: var(--text); }
.empty-sub { font-size: 12.5px; color: var(--text-muted); line-height: 1.5; margin: 6px 0 16px; }
.btn-nueva-grande { background: var(--primary); color: var(--surface); border: none; border-radius: 12px; padding: 11px 18px; font-size: 13.5px; font-weight: 600; cursor: pointer; }
.cuenta-acciones { display: flex; gap: 10px; justify-content: flex-end; margin-top: 2px; }
.btn-editar.danger { color: var(--expense); }

.patrimonio-card { background: var(--hero-bg); border-radius: 18px; padding: 18px; margin-bottom: 20px; color: var(--hero-text); }
.pat-label { font-size: 11.5px; color: var(--hero-muted); }
.pat-val { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 28px; letter-spacing: -0.02em; margin-top: 3px; }
.pat-usd { font-size: 12px; color: var(--hero-muted); font-family: 'JetBrains Mono', monospace; margin-top: 3px; }
.pat-row { display: flex; gap: 10px; margin-top: 14px; }
.pat-item { flex: 1; background: var(--surface); border-radius: 12px; padding: 10px 12px; }
.pat-item-label { font-size: 10.5px; color: var(--text-muted); }
.pat-item-val { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600; color: var(--text); margin-top: 2px; }
.pat-item-val.teal { color: var(--savings); }

.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 11px; }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); }
.section-total { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: var(--text-soft); }
.section-total.teal { color: var(--savings); }

.cuenta-list { display: flex; flex-direction: column; gap: 10px; }
.cuenta-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 14px; display: flex; align-items: center; gap: 12px; }
.cuenta-avatar { width: 40px; height: 40px; border-radius: 11px; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 16px; font-family: 'Space Grotesk', sans-serif; flex: none; }
.cuenta-info { flex: 1; min-width: 0; }
.cuenta-nombre { font-size: 13.5px; font-weight: 600; color: var(--text); }
.cuenta-usd { font-size: 11px; color: var(--text-muted); font-family: 'JetBrains Mono', monospace; }
.cuenta-right { text-align: right; }
.cuenta-saldo { font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 600; color: var(--text); }
.btn-editar { font-size: 10.5px; color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; margin-top: 2px; padding: 0; }

.ahorros-card { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; text-decoration: none; }
.ahorros-title { font-size: 13px; font-weight: 600; color: var(--text); }
.ahorros-sub { font-size: 11.5px; color: var(--text-muted); margin-top: 3px; line-height: 1.4; }
.ahorros-arrow { font-size: 18px; color: var(--savings); flex: none; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 18px; color: var(--text); }
.btn-cerrar { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
.field input { padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.btn-guardar { padding: 12px; background: var(--primary); color: var(--surface); border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
