import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/http';

export const useAuthStore = defineStore('auth', () => {
  const usuario = ref<any>(null);
  const cargando = ref(false);

  async function login(username: string, password: string) {
    cargando.value = true;
    try {
      const data = await http.post<{ usuario: any }>('/auth/login', { username, password });
      usuario.value = data.usuario;
    } finally {
      cargando.value = false;
    }
  }

  async function logout() {
    await http.post('/auth/logout');
    usuario.value = null;
  }

  async function cargarMe() {
    try {
      usuario.value = await http.get<any>('/auth/me');
    } catch {
      usuario.value = null;
    }
  }

  const esAdmin = () => usuario.value?.rol === 'admin';

  return { usuario, cargando, login, logout, cargarMe, esAdmin };
});
