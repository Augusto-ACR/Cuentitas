<template>
  <div class="shell">
    <!-- Sidebar desktop -->
    <aside class="sidebar" :class="{ 'sidebar--mini': colapsado }">
      <button class="sidebar-logo" @click="toggleSidebar" :title="colapsado ? 'Expandir menú' : 'Contraer menú'">
        <img v-if="colapsado" :src="logoMark" class="logo-mark-img" alt="Cuentitas" />
        <img v-else :src="logoExpandido" class="logo-full-img" alt="Cuentitas" />
      </button>
      <nav class="sidebar-nav">
        <RouterLink v-for="item in navItems" :key="item.to" :to="item.to" class="nav-item" active-class="nav-item--active" :title="item.label">
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
      <div class="sidebar-dollar" v-if="dolar.cotizacionPreferida && !colapsado">
        <div class="dollar-dot"></div>
        <div>
          <div class="dollar-label">Dólar {{ prefLabel }}</div>
          <div class="dollar-val">{{ ars(dolar.valorPreferido) }}</div>
        </div>
      </div>
    </aside>

    <!-- Contenido -->
    <main class="content">
      <RouterView />
    </main>

    <!-- Bottom nav mobile -->
    <nav class="bottom-nav">
      <RouterLink v-for="item in bottomNavItems" :key="item.to" :to="item.to" class="bn-item" active-class="bn-item--active">
        <span v-html="item.icon"></span>
        <span class="bn-label">{{ item.label }}</span>
      </RouterLink>
      <button class="bn-fab" aria-label="Nuevo movimiento" @click="router.push('/movimientos?nuevo=1')">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 6v12M6 12h12"/></svg>
      </button>
    </nav>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink, RouterView, useRouter } from 'vue-router';
import { useDolarStore } from '@/stores/dolar';
import { useAuthStore } from '@/stores/auth';
import { useTemaStore } from '@/stores/tema';
import { ars } from '@/lib/format';
import logoFull from '@/assets/logo-full.png';
import logoFullDark from '@/assets/logo-full-dark.png';
import logoMark from '@/assets/logo-mark.png';

const dolar = useDolarStore();
const auth = useAuthStore();
const tema = useTemaStore();
const router = useRouter();

// En tema oscuro, el logo+nombre usa la versión con el texto claro.
const logoExpandido = computed(() => (tema.tema === 'oscuro' ? logoFullDark : logoFull));

// Sidebar colapsable: se togglea tocando el logo y se recuerda en localStorage.
const colapsado = ref(localStorage.getItem('sidebar_colapsado') === '1');
function toggleSidebar() {
  colapsado.value = !colapsado.value;
  localStorage.setItem('sidebar_colapsado', colapsado.value ? '1' : '0');
}

onMounted(() => dolar.cargar());

const prefLabel = computed(() => {
  const m: Record<string, string> = { oficial: 'Oficial', mep: 'MEP', blue: 'Blue' };
  return m[auth.usuario?.dolarPref ?? 'blue'] ?? 'Blue';
});

const iconHome = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V20h13V9.5"/></svg>`;
const iconList = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h11"/></svg>`;
const iconCard = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18"/></svg>`;
const iconTarget = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.4"/></svg>`;
const iconChart = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4v16h16"/><path d="M8 16v-4M13 16V8M18 16v-6"/></svg>`;
const iconRepeat = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0115.5-6.2L21 8"/><path d="M21 4v4h-4M21 12a9 9 0 01-15.5 6.2L3 16"/><path d="M3 20v-4h4"/></svg>`;
const iconImport = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`;
const iconSettings = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>`;
const iconUsers = `<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="9" r="2.8"/><circle cx="16" cy="9.5" r="2.4"/><path d="M3.5 18c0-2.6 2.2-4 5-4s5 1.4 5 4M14.5 18c0-1.9 1-3.2 3-3.5"/></svg>`;

const navItems = computed(() => {
  const base = [
    { to: '/resumen',      label: 'Resumen',      icon: iconHome },
    { to: '/movimientos',  label: 'Movimientos',  icon: iconList },
    { to: '/cuentas',      label: 'Cuentas',      icon: iconCard },
    { to: '/metas',        label: 'Metas',        icon: iconTarget },
    { to: '/analisis',     label: 'Análisis',     icon: iconChart },
    { to: '/recurrentes',  label: 'Gastos fijos',  icon: iconRepeat },
    { to: '/importar',     label: 'Importar',     icon: iconImport },
    { to: '/ajustes',      label: 'Ajustes',      icon: iconSettings },
  ];
  if (auth.esAdmin()) base.push({ to: '/admin', label: 'Usuarios', icon: iconUsers });
  return base;
});

const bottomNavItems = [
  { to: '/resumen',     label: 'Resumen',     icon: iconHome },
  { to: '/movimientos', label: 'Movimientos', icon: iconList },
  { to: '/metas',       label: 'Metas',       icon: iconTarget },
  { to: '/analisis',    label: 'Análisis',    icon: iconChart },
];
</script>

<style scoped>
.shell {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
}

/* Sidebar desktop */
.sidebar {
  display: none;
  width: 240px;
  flex: none;
  background: var(--surface);
  border-right: 1px solid var(--surface-3);
  padding: 24px 16px;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  transition: width 0.18s ease;
}

/* Sidebar colapsada (solo el ícono) */
.sidebar--mini { width: 76px; padding-left: 12px; padding-right: 12px; }
.sidebar--mini .sidebar-logo { justify-content: center; padding-left: 0; padding-right: 0; }
.sidebar--mini .nav-item { justify-content: center; padding-left: 0; padding-right: 0; }
.sidebar--mini .nav-label { display: none; }

.sidebar-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 8px 22px;
  background: none;
  border: none;
  cursor: pointer;
  width: 100%;
}
.logo-full-img { height: 34px; width: auto; display: block; }
.logo-mark-img { width: 32px; height: 32px; display: block; }

.sidebar-nav { display: flex; flex-direction: column; gap: 3px; flex: 1; }
.nav-label { white-space: nowrap; }

.nav-item {
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border-radius: 11px;
  color: var(--text-soft);
  font-size: 13.5px;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.15s;
}
.nav-item:hover { background: var(--bg); }
.nav-item--active { background: var(--primary-soft); color: var(--primary); font-weight: 600; }

.sidebar-dollar {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--dollar-soft);
  color: var(--dollar);
  padding: 11px 13px;
  border-radius: 13px;
  margin-top: auto;
}
.dollar-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--dollar); flex: none; }
.dollar-label { font-size: 10px; color: #60A5FA; font-weight: 500; }
.dollar-val { font-size: 14px; font-weight: 600; font-family: 'Space Grotesk', sans-serif; }

/* Contenido */
.content {
  flex: 1;
  min-width: 0;
  padding-bottom: 80px; /* espacio para bottom-nav en mobile */
}

/* Bottom nav mobile */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface);
  border-top: 1px solid var(--surface-3);
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 9px 6px 13px;
  z-index: 100;
}

.bn-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 9.5px;
  font-weight: 500;
}
.bn-item--active { color: var(--primary); font-weight: 600; }

.bn-fab {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: var(--primary);
  color: var(--surface);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -26px;
  box-shadow: 0 8px 20px rgba(79,70,229,.4);
  cursor: pointer;
  flex: none;
}

@media (min-width: 768px) {
  .sidebar { display: flex; }
  .bottom-nav { display: none; }
  .content { padding-bottom: 0; }
}
</style>
