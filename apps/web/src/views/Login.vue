<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-logo">
        <div class="logo-icon">C</div>
        <span class="logo-name">Cuentitas</span>
      </div>
      <p class="login-sub">Finanzas de la familia</p>

      <form @submit.prevent="onSubmit" class="login-form">
        <div class="field">
          <label>Usuario</label>
          <input v-model="form.username" type="text" autocomplete="username" required />
        </div>
        <div class="field">
          <label>Contraseña</label>
          <div class="password-wrap">
            <input v-model="form.password" :type="verPassword ? 'text' : 'password'" autocomplete="current-password" required />
            <button type="button" class="toggle-pass" @click="verPassword = !verPassword" :aria-label="verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" :aria-pressed="verPassword">
              <svg v-if="verPassword" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" :disabled="cargando" class="btn-submit">
          {{ cargando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const router = useRouter();
const form = ref({ username: '', password: '' });
const error = ref('');
const cargando = ref(false);
const verPassword = ref(false);

async function onSubmit() {
  error.value = '';
  cargando.value = true;
  try {
    await auth.login(form.value.username, form.value.password);
    router.push('/resumen');
  } catch (e: any) {
    error.value = e.message || 'Error al iniciar sesión';
  } finally {
    cargando.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  padding: 24px;
}

.login-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 40px 36px;
  width: 100%;
  max-width: 380px;
  box-shadow: 0 1px 2px rgba(15,23,42,.04), 0 12px 40px rgba(15,23,42,.08);
}

.login-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--primary);
  color: var(--surface);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 700;
  font-size: 18px;
}

.logo-name {
  font-family: 'Space Grotesk', sans-serif;
  font-weight: 600;
  font-size: 22px;
  color: var(--text);
}

.login-sub {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 28px;
}

.login-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: var(--text-soft); }
.field input {
  padding: 11px 14px;
  border: 1px solid var(--border);
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: var(--text);
  background: var(--surface);
  outline: none;
  transition: border-color 0.15s;
}
.field input:focus { border-color: var(--primary); }

.password-wrap { position: relative; display: flex; }
.password-wrap input { flex: 1; padding-right: 44px; }
.toggle-pass {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: none;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: color 0.15s;
}
.toggle-pass:hover { color: var(--text-soft); }

.error-msg {
  font-size: 12.5px;
  color: var(--expense);
  background: var(--expense-soft);
  padding: 8px 12px;
  border-radius: 8px;
}

.btn-submit {
  padding: 12px;
  background: var(--primary);
  color: var(--surface);
  border: none;
  border-radius: 12px;
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
