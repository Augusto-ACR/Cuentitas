import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http } from '@/lib/http';
import { useDolarStore } from './dolar';

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

  async function crear(data: { nombre: string; saldo?: string; moneda?: string }) {
    await http.post('/cuentas', data);
    await cargar();
  }

  async function eliminar(id: number) {
    await http.delete(`/cuentas/${id}`);
    await cargar();
  }

  // Total de bancos en pesos-equivalente: las cuentas en USD se convierten al
  // dólar preferido del usuario (solo para el patrimonio; el saldo sigue en USD).
  const totalBancos = computed(() => {
    const dolar = useDolarStore();
    return cuentas.value.reduce((a, c) => {
      const saldo = parseFloat(c.saldo ?? 0);
      return a + (c.moneda === 'USD' ? saldo * dolar.valorPreferido : saldo);
    }, 0);
  });

  // Solo cuentas en pesos: las USD son para ahorro y no se usan en movimientos/gastos fijos.
  const cuentasARS = computed(() => cuentas.value.filter((c) => c.moneda !== 'USD'));

  return { cuentas, cuentasARS, totalAhorros, cargar, patchCuenta, crear, eliminar, totalBancos };
});
