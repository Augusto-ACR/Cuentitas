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
          <input v-model="form.password" type="password" autocomplete="current-password" required />
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
  background: #F6F7F9;
  padding: 24px;
}

.login-card {
  background: #fff;
  border: 1px solid #E6E9EF;
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
  background: #4F46E5;
  color: #fff;
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
  color: #0F172A;
}

.login-sub {
  font-size: 13px;
  color: #94A3B8;
  margin-bottom: 28px;
}

.login-form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; font-weight: 500; color: #475569; }
.field input {
  padding: 11px 14px;
  border: 1px solid #E6E9EF;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Inter', sans-serif;
  color: #0F172A;
  background: #fff;
  outline: none;
  transition: border-color 0.15s;
}
.field input:focus { border-color: #4F46E5; }

.error-msg {
  font-size: 12.5px;
  color: #E11D48;
  background: #FCE8EC;
  padding: 8px 12px;
  border-radius: 8px;
}

.btn-submit {
  padding: 12px;
  background: #4F46E5;
  color: #fff;
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
