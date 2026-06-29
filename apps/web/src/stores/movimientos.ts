import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/http';
import { mesActual } from '@/lib/format';

export const useMovimientosStore = defineStore('movimientos', () => {
  const items = ref<any[]>([]);
  const total = ref(0);
  const resumen = ref<any>(null);
  const cargando = ref(false);
  const mes = ref(mesActual());

  async function cargar(filtros: Record<string, any> = {}) {
    cargando.value = true;
    try {
      const params = new URLSearchParams({ mes: mes.value, ...filtros }).toString();
      const data = await http.get<any>(`/movimientos?${params}`);
      items.value = data.items;
      total.value = data.total;
    } finally {
      cargando.value = false;
    }
  }

  async function cargarResumen() {
    resumen.value = await http.get<any>(`/movimientos/resumen?mes=${mes.value}`);
  }

  async function crear(data: any) {
    const m = await http.post<any>('/movimientos', data);
    await cargar();
    return m;
  }

  async function actualizar(id: number, data: any) {
    const m = await http.patch<any>(`/movimientos/${id}`, data);
    await cargar();
    return m;
  }

  async function eliminar(id: number) {
    await http.delete(`/movimientos/${id}`);
    await cargar();
  }

  return { items, total, resumen, cargando, mes, cargar, cargarResumen, crear, actualizar, eliminar };
});
