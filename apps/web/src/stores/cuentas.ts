import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http } from '@/lib/http';

export const useCuentasStore = defineStore('cuentas', () => {
  const cuentas = ref<any[]>([]);
  // Total ahorrado (suma de aportes a metas/ahorros), en ARS. Viene del backend.
  const totalAhorros = ref(0);

  async function cargar() {
    const [cs, ahorro] = await Promise.all([
      http.get<any[]>('/cuentas'),
      http.get<{ totalARS: number }>('/metas/total-ahorrado'),
    ]);
    cuentas.value = cs;
    totalAhorros.value = ahorro.totalARS ?? 0;
  }

  async function patchCuenta(id: number, data: any) {
    await http.patch(`/cuentas/${id}`, data);
    await cargar();
  }

  async function crear(data: { nombre: string; saldo?: string }) {
    await http.post('/cuentas', data);
    await cargar();
  }

  async function eliminar(id: number) {
    await http.delete(`/cuentas/${id}`);
    await cargar();
  }

  const totalBancos = computed(() =>
    cuentas.value.reduce((a, c) => a + parseFloat(c.saldo ?? 0), 0),
  );

  return { cuentas, totalAhorros, cargar, patchCuenta, crear, eliminar, totalBancos };
});
