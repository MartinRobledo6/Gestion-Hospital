import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { Rol } from '../type/auth';

import AdmisionView from '../views/AdmisionView.vue';
import MedicosView from '../views/MedicosView.vue';
import SolicitarTurnoView from '../views/SolicitarTurnoView.vue';
import LoginView from '../views/loginview.vue';
import InicioView from '../views/inicioview.vue';
import UsuariosView from '../views/usuariosview.vue';
import MiAgendaView from '../views/MiAgendaView.vue';
import GuardiaView from '../views/GuardiaView.vue';

// Tipamos el meta para que TypeScript te avise si escribís mal un rol
declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean;
    roles?: Rol[];
    exacto?: boolean; // true = el admin NO entra por defecto
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

    // Con roles = solo esos (el admin entra siempre, salvo exacto: true)
    { path: '/usuarios', component: UsuariosView, meta: { roles: ['ADMINISTRADOR'] } },
    { path: '/admision', component: AdmisionView, meta: { roles: ['RECEPCIONISTA'] } },
    // Recepción carga horarios; el alta de profesionales dentro de la vista es solo para admin
    { path: '/Profesional', component: MedicosView, meta: { roles: ['RECEPCIONISTA'] } },
    { path: '/mi-agenda', component: MiAgendaView, meta: { roles: ['MEDICO'], exacto: true } },

    { path: '/:pathMatch(.*)*', redirect: '/' },
        { path: '/mi-agenda', component: MiAgendaView, meta: { roles: ['MEDICO'], exacto: true } },
    { path: '/guardia', component: GuardiaView, meta: { roles: ['ENFERMERO', 'MEDICO'] } },
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

  if (!auth.puedeEntrar(to.meta.roles, to.meta.exacto)) {
    return { path: '/inicio', query: { sinPermiso: '1' } };
  }

  return true;
});

export default router;