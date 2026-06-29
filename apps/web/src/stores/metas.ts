import { defineStore } from 'pinia';
import { ref } from 'vue';
import { http } from '@/lib/http';

export const useMetasStore = defineStore('metas', () => {
  const items = ref<any[]>([]);

  async function cargar() {
    items.value = await http.get<any[]>('/metas');
  }

  async function crear(data: any) {
    await http.post('/metas', data);
    await cargar();
  }

  async function agregarAporte(metaId: number, montoARS: number, fecha: string, cuentaId: number) {
    await http.post(`/metas/${metaId}/aportes`, { montoARS, fecha, cuentaId });
    await cargar();
  }

  async function retirar(metaId: number, montoARS: number, fecha: string, cuentaId: number) {
    await http.post(`/metas/${metaId}/retiros`, { montoARS, fecha, cuentaId });
    await cargar();
  }

  async function completar(metaId: number) {
    await http.post(`/metas/${metaId}/completar`);
    await cargar();
  }

  async function eliminar(metaId: number, cuentaId?: number) {
    await http.delete(`/metas/${metaId}`, cuentaId ? { cuentaId } : undefined);
    await cargar();
  }

  async function agregarParticipante(metaId: number, usuarioId: number) {
    await http.post(`/metas/${metaId}/participantes`, { usuarioId });
    await cargar();
  }

  return { items, cargar, crear, agregarAporte, retirar, completar, eliminar, agregarParticipante };
});
