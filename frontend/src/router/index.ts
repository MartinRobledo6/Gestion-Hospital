import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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
    }
  ],
})

export default router
