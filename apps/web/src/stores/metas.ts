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

  async function agregarAporte(metaId: number, montoARS: number, fecha: string) {
    await http.post(`/metas/${metaId}/aportes`, { montoARS, fecha });
    await cargar();
  }

  async function agregarParticipante(metaId: number, usuarioId: number) {
    await http.post(`/metas/${metaId}/participantes`, { usuarioId });
    await cargar();
  }

  return { items, cargar, crear, agregarAporte, agregarParticipante };
});
