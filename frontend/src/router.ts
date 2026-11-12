import { createRouter, createWebHistory } from "vue-router";
import Facturacion from "./views/Facturacion.vue";

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/facturacion" },
    { path: "/facturacion", component: Facturacion },
  ],
});
