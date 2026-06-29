<template>
  <div class="page">
    <header class="page-header">
      <div>
        <div class="page-sub">Cuentitas · Admin</div>
        <h1 class="page-title">Usuarios</h1>
      </div>
      <button class="btn-nuevo" @click="abrirNuevo">+ Nuevo</button>
    </header>

    <div class="user-list">
      <div v-for="u in usuarios" :key="u.id" class="user-card">
        <div class="user-avatar" :class="u.rol === 'admin' ? 'admin' : ''">{{ u.nombre[0] }}</div>
        <div class="user-info">
          <div class="user-nombre">{{ u.nombre }}</div>
          <div class="user-meta">@{{ u.username }} · {{ u.rol }}</div>
          <div class="user-meta muted">Miembro desde {{ fechaCorta(u.createdAt) }}</div>
        </div>
        <div class="user-actions" v-if="u.id !== authStore.usuario?.id">
          <button class="btn-reset" @click="abrirReset(u)">Cambiar contraseña</button>
          <button class="btn-del" @click="eliminarUsuario(u)">Eliminar</button>
        </div>
      </div>
    </div>

    <!-- Modal nuevo usuario -->
    <div v-if="modalNuevo" class="modal-overlay" @click.self="modalNuevo = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Nuevo usuario</h2>
          <button @click="modalNuevo = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="crearUsuario" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Nombre</label><input v-model="formNuevo.nombre" required /></div>
          <div class="field"><label>Username</label><input v-model="formNuevo.username" required /></div>
          <div class="field"><label>Contraseña inicial</label><input v-model="formNuevo.password" type="password" required /></div>
          <div class="field">
            <label>Rol</label>
            <select v-model="formNuevo.rol">
              <option value="miembro">Miembro</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div class="field">
            <label>Tipo de dólar preferido</label>
            <select v-model="formNuevo.dolarPref">
              <option value="blue">Blue</option>
              <option value="mep">MEP</option>
              <option value="oficial">Oficial</option>
            </select>
          </div>
          <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
          <button type="submit" class="btn-guardar">Crear usuario</button>
        </form>
      </div>
    </div>

    <!-- Modal reset password -->
    <div v-if="modalReset" class="modal-overlay" @click.self="modalReset = false">
      <div class="modal">
        <div class="modal-header">
          <h2>Cambiar contraseña · {{ resetUsuario?.nombre }}</h2>
          <button @click="modalReset = false" class="btn-cerrar">✕</button>
        </div>
        <form @submit.prevent="resetPassword" style="display:flex;flex-direction:column;gap:14px">
          <div class="field"><label>Nueva contraseña</label><input v-model="newPassword" type="password" required minlength="6" /></div>
          <div v-if="errorMsg" class="form-error">{{ errorMsg }}</div>
          <button type="submit" class="btn-guardar">Guardar</button>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { http } from '@/lib/http';

const authStore = useAuthStore();
const usuarios = ref<any[]>([]);
const modalNuevo = ref(false);
const modalReset = ref(false);
const resetUsuario = ref<any>(null);
const newPassword = ref('');
const errorMsg = ref('');
const formNuevo = ref({ nombre: '', username: '', password: '', rol: 'miembro', dolarPref: 'blue' });

function fechaCorta(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function abrirNuevo() {
  formNuevo.value = { nombre: '', username: '', password: '', rol: 'miembro', dolarPref: 'blue' };
  errorMsg.value = '';
  modalNuevo.value = true;
}

function abrirReset(u: any) {
  resetUsuario.value = u;
  newPassword.value = '';
  errorMsg.value = '';
  modalReset.value = true;
}

async function cargar() {
  usuarios.value = await http.get<any[]>('/usuarios');
}

async function crearUsuario() {
  errorMsg.value = '';
  try {
    await http.post('/usuarios', formNuevo.value);
    modalNuevo.value = false;
    await cargar();
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Error al crear el usuario';
  }
}

async function resetPassword() {
  errorMsg.value = '';
  try {
    await http.post(`/usuarios/${resetUsuario.value.id}/reset-password`, { password: newPassword.value });
    modalReset.value = false;
  } catch (e: any) {
    errorMsg.value = e?.message ?? 'Error al cambiar la contraseña';
  }
}

async function eliminarUsuario(u: any) {
  if (!confirm(`¿Eliminar a ${u.nombre}? Esta acción es irreversible.`)) return;
  await http.delete(`/usuarios/${u.id}`);
  await cargar();
}

onMounted(cargar);
</script>

<style scoped>
.page { padding: 20px 16px 24px; max-width: 680px; margin: 0 auto; }
.page-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.page-sub { font-size: 11px; color: var(--text-muted); }
.page-title { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 22px; color: var(--text); }
.btn-nuevo { background: var(--primary); color: var(--surface); border: none; border-radius: 12px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; }

.user-list { display: flex; flex-direction: column; gap: 11px; }
.user-card { background: var(--surface); border: 1px solid var(--border); border-radius: 16px; padding: 15px; display: flex; align-items: center; gap: 13px; }
.user-avatar { width: 42px; height: 42px; border-radius: 50%; background: var(--primary-soft); color: var(--primary); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 16px; font-family: 'Space Grotesk', sans-serif; flex: none; }
.user-avatar.admin { background: var(--warning-soft); color: var(--warning); }
.user-info { flex: 1; min-width: 0; }
.user-nombre { font-size: 13.5px; font-weight: 600; color: var(--text); }
.user-meta { font-size: 11.5px; color: var(--text-soft); margin-top: 2px; }
.user-meta.muted { color: var(--text-muted); }
.user-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.btn-reset { font-size: 11px; color: var(--primary); font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; }
.btn-del { font-size: 11px; color: var(--expense); font-weight: 600; background: none; border: none; cursor: pointer; padding: 0; }

.modal-overlay { position: fixed; inset: 0; background: rgba(15,23,42,.4); z-index: 200; display: flex; align-items: flex-end; justify-content: center; }
.modal { background: var(--surface); border-radius: 20px 20px 0 0; padding: 24px 20px 32px; width: 100%; max-width: 480px; }
.modal-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.modal-header h2 { font-family: 'Space Grotesk', sans-serif; font-weight: 600; font-size: 17px; color: var(--text); }
.btn-cerrar { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; }
.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 12.5px; font-weight: 500; color: var(--text-soft); }
.field input, .field select { padding: 10px 12px; border: 1px solid var(--border); border-radius: 12px; font-size: 14px; font-family: 'Inter', sans-serif; }
.form-error { font-size: 12.5px; color: var(--expense); padding: 8px 12px; background: var(--expense-soft); border-radius: 10px; }
.btn-guardar { padding: 12px; background: var(--primary); color: var(--surface); border: none; border-radius: 12px; font-weight: 600; font-size: 14px; cursor: pointer; }
</style>
