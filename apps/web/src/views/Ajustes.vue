<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas</div>
        <h1 class="page-title">Ajustes</h1>
      </div>
    </header>

    <!-- Preferencia dólar -->
    <div class="section-title">Tipo de dólar preferido</div>
    <div class="card">
      <div class="pref-desc">Se usa para mostrar valores en USD en toda la app.</div>
      <div class="pref-pills">
        <button v-for="opt in ['oficial','mep','blue']" :key="opt"
          class="pref-pill" :class="{ active: pref === opt }"
          @click="cambiarPref(opt as any)">
          {{ opt.charAt(0).toUpperCase() + opt.slice(1) }}
          <span class="pref-val" v-if="dolar.cotizaciones[opt]">{{ ars(dolar.cotizaciones[opt].valor) }}</span>
        </button>
      </div>
      <div class="pref-ok" v-if="prefOk">Guardado</div>
    </div>

    <!-- Categorías propias -->
    <div class="section-header">
      <span class="section-title">Mis categorías</span>
      <button class="btn-nueva" @click="abrirNueva">+ Nueva</button>
    </div>

    <div class="cat-list">
      <!-- Base del sistema -->
      <div class="cat-group-title">Globales</div>
      <div v-for="c in catsSistema" :key="c.id" class="cat-row">
        <span class="cat-dot" :style="{ background: c.color }"></span>
        <span class="cat-label">{{ c.label }}</span>
        <span class="cat-badge">sistema</span>
      </div>

      <!-- Propias -->
      <div class="cat-group-title" style="margin-top:12px">Personales</div>
      <div v-if="!catsPersonales.length" class="cats-empty">No tenés categorías personales todavía.</div>
      <div v-for="c in catsPersonales" :key="c.id" class="cat-row">
        <span class="cat-dot" :style="{ background: c.color }"></span>
        <span class="cat-label">{{ c.label }}</span>
        <button class="btn-del" @click="eliminarCat(c.id)">✕</button>
      </div>
    </div>

    <!-- Seguridad: cambiar contraseña -->
    <div class="section-title" style="margin-top:24px">Seguridad</div>
    <div class="card">
      <form @submit.prevent="cambiarPassword" style="display:flex;flex-direction:column;gap:12px">
        <div class="field"><label>Contraseña actual</label><input v-model="pwd.actual" type="password" required /></div>
        <div class="field"><label>Nueva contraseña</label><input v-model="pwd.nueva" type="password" minlength="6" required /></div>
        <div class="field"><label>Repetir nueva contraseña</label><input v-model="pwd.repetir" type="password" required /></div>
        <div v-if="pwdError" class="form-error">{{ pwdError }}</div>
        <div v-if="pwdOk" class="form-ok">Contraseña actualizada.</div>
        <button type="submit" class="btn-pwd">Cambiar contraseña</button>
      </form>
    </div>

    <!-- Apariencia -->
    <div class="section-title" style="margin-top:24px">Apariencia</div>
    <div class="card">
      <div class="pref-desc">Elegí cómo se ve la app.</div>
      <div class="pref-pills">
        <button class="pref-pill" :class="{ active: tema.tema === 'claro' }" @click="tema.aplicar('claro')">Claro</button>
        <button class="pref-pill" :class="{ active: tema.tema === 'oscuro' }" @click="tema.aplicar('oscuro')">Oscuro</button>
      </div>
    </div>

    <!-- Cuenta -->
    <div class="section-title" style="margin-top:24px">Cuenta</div>
    <button class="btn-logout" @click="cerrarSesion">Cerrar sesión</button>

    <!-- Modal nueva categoría -->
    <div v-if="modal" class="modal-overlay" @click.self="modal = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Nueva categoría</h2>
          <button @click="modal = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="crearCat" style="display:flex;flex-direction:column;gap:14px">
          <div class="field">
            <label>Nombre</label>
            <input v-model="formCat.label" required placeholder="Ej: Mascota" />
          </div>
          <div class="field">
            <label>Color</label>
            <div class="color-picker">
              <button v-for="col in COLORES" :key="col" type="button"
                class="col-swatch" :style="{ background: col }"
                :class="{ selected: formCat.color === col }"
                @click="formCat.color = col"></button>
            </div>
          </div>
          <div class="field">
            <label>Palabras clave (para autocategorizar, separadas por coma)</label>
            <input v-model="formCat.matchesRaw" placeholder="veterinario, petshop" />
          </div>
          <button type="submit" class="btn-guardar">Crear</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useDolarStore } from '@/stores/dolar';
import { useAuthStore } from '@/stores/auth';
import { useTemaStore } from '@/stores/tema';
import { http } from '@/lib/http';
import { ars } from '@/lib/format';

const dolar = useDolarStore();
const auth = useAuthStore();
const tema = useTemaStore();
const router = useRouter();

async function cerrarSesion() {
  await auth.logout();
  router.push('/login');
}

const COLORES = ['#E11D48','#F97316','#EAB308','#16A34A','#0D9488','#2563EB','#7C3AED','#A855F7','#EC4899','#6B7280'];

const pref = ref(auth.usuario?.dolarPref ?? 'blue');
const prefOk = ref(false);
const modal = ref(false);
const cats = ref<any[]>([]);
const formCat = ref({ label: '', color: '#4F46E5', matchesRaw: '' });
const pwd = ref({ actual: '', nueva: '', repetir: '' });
const pwdError = ref('');
const pwdOk = ref(false);

const catsSistema = computed(() => cats.value.filter(c => c.sistema));
const catsPersonales = computed(() => cats.value.filter(c => !c.sistema));

async function cambiarPref(val: 'oficial' | 'mep' | 'blue') {
  pref.value = val;
  await http.patch('/usuarios/preferencias', { dolarPref: val });
  if (auth.usuario) auth.usuario.dolarPref = val;
  prefOk.value = true;
  setTimeout(() => { prefOk.value = false; }, 2000);
}

async function cambiarPassword() {
  pwdError.value = '';
  pwdOk.value = false;
  if (pwd.value.nueva !== pwd.value.repetir) {
    pwdError.value = 'Las contraseñas nuevas no coinciden';
    return;
  }
  try {
    await http.post('/auth/cambiar-password', { actual: pwd.value.actual, nueva: pwd.value.nueva });
    pwd.value = { actual: '', nueva: '', repetir: '' };
    pwdOk.value = true;
    setTimeout(() => { pwdOk.value = false; }, 3000);
  } catch (e: any) {
    pwdError.value = e?.message ?? 'No se pudo cambiar la contraseña';
  }
}

function abrirNueva() { formCat.value = { label: '', color: '#4F46E5', matchesRaw: '' }; modal.value = true; }

async function crearCat() {
  const matches = formCat.value.matchesRaw.split(',').map(s => s.trim()).filter(Boolean);
  const slug = formCat.value.label.toLowerCase().replace(/\s+/g, '-');
  await http.post<any>('/categorias', { slug, label: formCat.value.label, color: formCat.value.color, matches });
  modal.value = false;
  await cargarCats();
}

async function eliminarCat(id: number) {
  if (!confirm('¿Eliminar esta categoría?')) return;
  await http.delete(`/categorias/${id}`);
  await cargarCats();
}

async function cargarCats() {
  cats.value = await http.get<any[]>('/categorias');
}

onMounted(() => { dolar.cargar(); cargarCats(); });
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { margin-bottom: 18px; }
.page-sub { font-size: 11px; color: var(--text-muted); }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: var(--text); }
.section-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; margin-top: 24px; }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 16px; margin-bottom: 12px; }
.btn-nueva { font-size: 12px; color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; }

.pref-desc { font-size: 12px; color: var(--text-muted); margin-bottom: 12px; }
.pref-pills { display: flex; gap: 10px; }
.pref-pill { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px; border: 1.5px solid var(--border); border-radius: 13px; background: var(--surface); cursor: pointer; font-size: 13px; font-weight: 600; color: var(--text-soft); transition: border-color 0.2s; }
.pref-pill.active { border-color: var(--primary); color: var(--primary); background: var(--primary-soft); }
.pref-val { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; color: var(--text-muted); font-weight: 400; }
.pref-pill.active .pref-val { color: var(--primary); }
.pref-ok { font-size: 12px; color: var(--income); font-weight: 600; margin-top: 10px; }

.cat-list { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 14px 16px; }
.cat-group-title { font-size: 10.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
.cat-row { display: flex; align-items: center; gap: 10px; padding: 7px 0; border-bottom: 1px solid var(--surface-2); }
.cat-row:last-child { border-bottom: none; }
.cat-dot { width: 10px; height: 10px; border-radius: 50%; flex: none; }
.cat-label { flex: 1; font-size: 13px; color: var(--text); }
.cat-badge { font-size: 10px; color: var(--text-muted); background: var(--surface-2); padding: 2px 7px; border-radius: 999px; }
.btn-del { background: none; border: none; color: var(--text-muted); font-size: 14px; cursor: pointer; padding: 0 4px; }
.cats-empty { font-size: 12px; color: var(--text-muted); padding: 8px 0; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 17px; color: var(--text); }
.btn-cerrar { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
.field input { padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.color-picker { display: flex; gap: 8px; flex-wrap: wrap; }
.col-swatch { width: 28px; height: 28px; border-radius: 8px; border: 2.5px solid transparent; cursor: pointer; transition: transform 0.15s; }
.col-swatch.selected { border-color: var(--text); transform: scale(1.15); }
.btn-guardar { padding: 12px; background: var(--primary); color: var(--surface); border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
.field input[type="password"] { padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.form-error { font-size: 12.5px; color: var(--expense); background: var(--expense-soft); padding: 8px 12px; border-radius: 10px; }
.form-ok { font-size: 12.5px; color: var(--income); background: var(--income-soft); padding: 8px 12px; border-radius: 10px; }
.btn-pwd { padding: 11px; background: var(--text); color: var(--surface); border: none; border-radius: 12px; font-weight: 600; font-size: 13.5px; cursor: pointer; margin-top: 2px; }
.btn-logout { width: 100%; padding: 12px; background: var(--expense-soft); color: var(--expense); border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
