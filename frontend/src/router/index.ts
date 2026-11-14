
import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { Rol } from '../type/auth';

import EnfermeriaView from '../modules/enfermeria/enfermeriaView.vue';

import AdmisionView from '../views/AdmisionView.vue';
import MedicosView from '../views/MedicosView.vue';
import SolicitarTurnoView from '../views/SolicitarTurnoView.vue';
import LoginView from '../views/loginview.vue';
import InicioView from '../views/inicioview.vue';
import UsuariosView from '../views/usuariosview.vue';
import MiAgendaView from '../views/MiAgendaView.vue';
import GuardiaView from '../views/GuardiaView.vue';
import FacturacionView from '../views/Facturacion.vue';

declare module 'vue-router' {
  interface RouteMeta {
    publica?: boolean;
    roles?: Rol[];
    exacto?: boolean;
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

    // Rutas públicas
    {
      path: '/login',
      component: LoginView,
      meta: { publica: true },
    },
    {
      path: '/solicitar-turno',
      component: SolicitarTurnoView,
      meta: { publica: true },
    },

    // Inicio y administración
    { path: '/inicio', component: InicioView },
    {
      path: '/usuarios',
      component: UsuariosView,
      meta: { roles: ['ADMINISTRADOR'] },
    },

    // Admisión y profesionales
    {
      path: '/admision',
      component: AdmisionView,
      meta: { roles: ['RECEPCIONISTA'] },
    },
    {
      path: '/Profesional',
      component: MedicosView,
      meta: { roles: ['RECEPCIONISTA'] },
    },

    // Agenda médica, guardia y facturación
    {
      path: '/mi-agenda',
      component: MiAgendaView,
      meta: { roles: ['MEDICO'], exacto: true },
    },
    {
      path: '/guardia',
      component: GuardiaView,
      meta: { roles: ['ENFERMERO', 'MEDICO'] },
    },
    {
      path: '/facturacion',
      component: FacturacionView,
      meta: { roles: ['ADMINISTRADOR', 'RECEPCIONISTA'] },
    },

    // Módulos existentes de Martín y Nacho
    { path: '/camas', name: 'CamasList', component: () => import('../views/CamasList.vue') },
    { path: '/inventario', name: 'InventarioList', component: () => import('../views/InventarioList.vue') },
    { path: '/hce', name: 'HceView', component: () => import('../views/HceView.vue') },

    // Enfermería
    {
      path: '/enfermeria',
      component: EnfermeriaView,
      redirect: '/enfermeria/signos-vitales',
      children: [
        {
          path: 'signos-vitales',
          name: 'signos-vitales',
          component: () => import('../modules/enfermeria/views/VitalSignsView.vue'),
        },
        {
          path: 'medicacion',
          name: 'medicacion',
          component: () => import('../modules/enfermeria/views/MedicationView.vue'),
        },
        {
          path: 'alertas',
          name: 'alertas',
          component: () => import('../modules/enfermeria/views/AlertsView.vue'),
        },
        {
          path: 'protocolos',
          name: 'protocolos',
          component: () => import('../modules/enfermeria/views/ProtocolsView.vue'),
        },
      ],
    },

    // Cualquier ruta inexistente vuelve al inicio
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.publica) {
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
