import { defineStore } from 'pinia';
import { ref } from 'vue';

type Tema = 'claro' | 'oscuro';

export const useTemaStore = defineStore('tema', () => {
  const tema = ref<Tema>('claro');

  function aplicar(t: Tema) {
    tema.value = t;
    document.documentElement.dataset.theme = t === 'oscuro' ? 'dark' : 'light';
    localStorage.setItem('cuentitas-tema', t);
  }

  function init() {
    const guardado = localStorage.getItem('cuentitas-tema') as Tema | null;
    const prefiereOscuro = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    aplicar(guardado ?? (prefiereOscuro ? 'oscuro' : 'claro'));
  }

  function toggle() {
    aplicar(tema.value === 'oscuro' ? 'claro' : 'oscuro');
  }

  return { tema, init, aplicar, toggle };
});
