import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/http';
import { mesActual } from '@/lib/format';

export const useRecurrentesStore = defineStore('recurrentes', () => {
  const items = ref<any[]>([]);

  async function cargar(mes?: string) {
    const m = mes ?? mesActual();
    items.value = await http.get<any[]>(`/recurrentes?mes=${m}`);
  }

  async function confirmar(id: number, mes: string, monto: number) {
    const res = await http.post<any>(`/recurrentes/${id}/confirmar`, { mes, monto });
    await cargar(mes);
    return res;
  }

  async function crear(data: any) {
    await http.post('/recurrentes', data);
    await cargar();
  }

  async function eliminar(id: number) {
    await http.delete(`/recurrentes/${id}`);
    await cargar();
  }

  return { items, cargar, confirmar, crear, eliminar };
});
