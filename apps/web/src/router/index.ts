import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('@/components/layout/AppShell.vue'),
    children: [
      { path: '', redirect: '/resumen' },
      { path: 'resumen', component: () => import('@/views/Resumen.vue') },
      { path: 'movimientos', component: () => import('@/views/Movimientos.vue') },
      { path: 'cuentas', component: () => import('@/views/Cuentas.vue') },
      { path: 'metas', component: () => import('@/views/Metas.vue') },
      { path: 'analisis', component: () => import('@/views/Analisis.vue') },
      { path: 'recurrentes', component: () => import('@/views/Recurrentes.vue') },
      { path: 'importar', component: () => import('@/views/ImportExport.vue') },
      { path: 'ajustes', component: () => import('@/views/Ajustes.vue') },
      { path: 'admin', component: () => import('@/views/AdminUsuarios.vue') },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  if (to.meta.public) return true;
  const auth = useAuthStore();
  if (!auth.usuario) {
    await auth.cargarMe();
  }
  if (!auth.usuario) return '/login';
  return true;
});

export default router;
