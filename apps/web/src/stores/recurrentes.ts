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

  async function desconfirmar(id: number, mes: string) {
    await http.post(`/recurrentes/${id}/desconfirmar`, { mes });
    await cargar(mes);
  }

  async function crear(data: any) {
    await http.post('/recurrentes', data);
    await cargar();
  }

  async function actualizar(id: number, data: any, mes?: string) {
    await http.patch(`/recurrentes/${id}`, data);
    await cargar(mes);
  }

  async function eliminar(id: number, mes?: string) {
    await http.delete(`/recurrentes/${id}`);
    await cargar(mes);
  }

  return { items, cargar, confirmar, desconfirmar, crear, actualizar, eliminar };
});
