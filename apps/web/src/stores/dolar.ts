import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { http } from '@/lib/http';
import { useAuthStore } from './auth';

export const useDolarStore = defineStore('dolar', () => {
  const cotizaciones = ref<Record<string, any>>({});

  async function cargar() {
    cotizaciones.value = await http.get<any>('/dolar');
  }

  const cotizacionPreferida = computed(() => {
    const auth = useAuthStore();
    const pref = auth.usuario?.dolarPref ?? 'blue';
    return cotizaciones.value[pref] ?? null;
  });

  const valorPreferido = computed((): number => {
    return parseFloat(cotizacionPreferida.value?.valor ?? '1478');
  });

  return { cotizaciones, cotizacionPreferida, valorPreferido, cargar };
});
