import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http } from '@/lib/http';

export const useCuentasStore = defineStore('cuentas', () => {
  const cuentas = ref<any[]>([]);
  const buckets = ref<any[]>([]);

  async function cargar() {
    [cuentas.value, buckets.value] = await Promise.all([
      http.get<any[]>('/cuentas'),
      http.get<any[]>('/buckets'),
    ]);
  }

  async function patchCuenta(id: number, data: any) {
    await http.patch(`/cuentas/${id}`, data);
    await cargar();
  }

  async function patchBucket(id: number, data: any) {
    await http.patch(`/buckets/${id}`, data);
    await cargar();
  }

  const totalBancos = computed(() =>
    cuentas.value.reduce((a, c) => a + parseFloat(c.saldo ?? 0), 0),
  );

  const totalAhorros = computed(() =>
    buckets.value.reduce((a, b) => a + parseFloat(b.monto ?? 0), 0),
  );

  return { cuentas, buckets, cargar, patchCuenta, patchBucket, totalBancos, totalAhorros };
});
