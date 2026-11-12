
import { createRouter, createWebHistory } from 'vue-router'

import EnfermeriaView from '../modules/enfermeria/enfermeriaView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/camas',
    },
    {
      path: '/camas',
      name: 'CamasList',
      component: () => import('../views/CamasList.vue'),
    },
    {
      path: '/inventario',
      name: 'InventarioList',
      component: () => import('../views/InventarioList.vue'),
    },
    {
      path: '/hce',
      name: 'HceView',
      component: () => import('../views/HceView.vue'),
    },
    {
      path: '/enfermeria',
      component: EnfermeriaView,
      redirect: '/enfermeria/signos-vitales',
      children: [
        {
          path: 'signos-vitales',
          name: 'signos-vitales',
          component: () =>
            import('../modules/enfermeria/views/VitalSignsView.vue'),
        },
        {
          path: 'medicacion',
          name: 'medicacion',
          component: () =>
            import('../modules/enfermeria/views/MedicationView.vue'),
        },
        {
          path: 'alertas',
          name: 'alertas',
          component: () =>
            import('../modules/enfermeria/views/AlertsView.vue'),
        },
        {
          path: 'protocolos',
          name: 'protocolos',
          component: () =>
            import('../modules/enfermeria/views/ProtocolsView.vue'),
        },
      ],
    },
  ],
})

export default router
