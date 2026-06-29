import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/http';

export const useRecurrentesStore = defineStore('recurrentes', () => {
  const items = ref<any[]>([]);

  async function cargar() {
    items.value = await http.get<any[]>('/recurrentes');
  }

  async function crear(data: any) {
    await http.post('/recurrentes', data);
    await cargar();
  }

  async function actualizar(id: number, data: any) {
    await http.patch(`/recurrentes/${id}`, data);
    await cargar();
  }

  async function eliminar(id: number) {
    await http.delete(`/recurrentes/${id}`);
    await cargar();
  }

  // Carga la plantilla como un movimiento (gasto) del mes.
  async function cargarMes(id: number, monto: number, fecha: string) {
    await http.post(`/recurrentes/${id}/cargar`, { monto, fecha });
    await cargar();
  }

  return { items, cargar, crear, actualizar, eliminar, cargarMes };
});
