import { createRouter, createWebHistory } from 'vue-router';

// Ajustá los imports si tus vistas están en otra carpeta o tienen otro nombre

import AdmisionView from '../views/AdmisionView.vue';
import MedicosView from '../views/MedicosView.vue';
import SolicitarTurnoView from '../views/SolicitarTurnoView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [  
    { path: '/admision', component: AdmisionView },
    { path: '/medicos', component: MedicosView },
    // Vista del paciente: no aparece en el menú de admin
    {
      path: '/solicitar-turno',
      component: SolicitarTurnoView,
      meta: { publica: true },
    },
  ],
});

export default router;