import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { Rol } from '../type/auth';

import AdmisionView from '../views/AdmisionView.vue';
import MedicosView from '../views/MedicosView.vue';
import SolicitarTurnoView from '../views/SolicitarTurnoView.vue';
import LoginView from '../views/loginview.vue';
import InicioView from '../views/inicioview.vue';
import UsuariosView from '../views/usuariosview.vue';

// Tipamos el meta para que TypeScript te avise si escribís mal un rol
declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean;
    roles?: Rol[];
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: () => {
        const auth = useAuthStore();
        return auth.haySesion() ? auth.home : '/login';
      },
    },
    { path: '/login', component: LoginView, meta: { publica: true } },
    {
      path: '/solicitar-turno',
      component: SolicitarTurnoView,
      meta: { publica: true },
    },

    // Sin roles = cualquier usuario logueado
    { path: '/inicio', component: InicioView },

    // Con roles = solo esos (el admin entra siempre)
    { path: '/usuarios', component: UsuariosView, meta: { roles: ['ADMINISTRADOR'] } },
    { path: '/admision', component: AdmisionView, meta: { roles: ['RECEPCIONISTA', 'MEDICO'] } },
    { path: '/Profesional', component: MedicosView, meta: { roles: ['ADMINISTRADOR'] } },

    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.publica) {
    // Si ya está logueado, no tiene sentido mostrarle el login
    if (to.path === '/login' && auth.haySesion()) return auth.home;
    return true;
  }

  if (!auth.haySesion()) {
    return { path: '/login', query: { redirect: to.fullPath } };
  }

  if (!auth.puedeEntrar(to.meta.roles)) {
    return { path: '/inicio', query: { sinPermiso: '1' } };
  }

  return true;
});

export default router;