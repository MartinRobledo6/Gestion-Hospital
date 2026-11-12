<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';
import { useAuthStore } from './stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const esPublica = computed(() => route.meta.publica === true);

// Camas e Inventario no están: agregalos cuando mergeen esos módulos,
// con su ruta (y meta.roles) en el router
const todosLosEnlaces = [
  { to: '/usuarios', texto: 'Usuarios' },
  { to: '/admision', texto: 'Admisión' },
  { to: '/Profesional', texto: 'Profesional' },
  { to: '/mi-agenda', texto: 'Mi agenda' },
  { to: '/guardia', texto: 'Guardia' },
  { to: '/facturacion', texto: 'Facturación' },
];

// Los permisos se leen del router (meta.roles): una sola fuente de verdad
const enlaces = computed(() =>
  todosLosEnlaces.filter((e) => {
    const meta = router.resolve(e.to).meta;
    return auth.puedeEntrar(meta.roles, meta.exacto);
  }),
);

const cerrarSesion = async () => {
  auth.logout();
  await router.push('/login');
};
</script>

<template>
  <div class="app">
    <header class="barra">
      <div class="barra-interior">
        <RouterLink :to="esPublica ? '/solicitar-turno' : auth.home" class="marca">
          <span class="logo" aria-hidden="true">🏥</span>
          Gestión Hospitalaria
        </RouterLink>

        <nav v-if="!esPublica" class="menu" aria-label="Navegación principal">
          <RouterLink
            v-for="e in enlaces"
            :key="e.to"
            :to="e.to"
            class="enlace"
          >
            {{ e.texto }}
          </RouterLink>
        </nav>

        <div v-if="!esPublica && auth.usuario" class="sesion">
          <span class="usuario">{{ auth.usuario.nombre }}</span>
          <button type="button" class="salir" @click="cerrarSesion">
            Salir
          </button>
        </div>
      </div>
    </header>

    <main class="contenido">
      <RouterView />
    </main>
  </div>
</template>

<style>
/* Globales */
html,
body {
  margin: 0;
  background: #f8fafc;
}

#app {
  max-width: none;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app {
  --azul: #0a7bc4;
  --texto: #1e293b;
  --suave: #64748b;

  min-height: 100vh;
  background: #f8fafc;
  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

/* Barra superior */
.barra {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
  border-bottom: 2px solid var(--azul);
}

.barra-interior {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 64px;
  padding: 0 32px;
}

.marca {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.25rem;
  font-weight: 700;
  color: #334155;
  text-decoration: none;
  white-space: nowrap;
}

.logo {
  font-size: 1.5rem;
}

/* Menú */
.menu {
  display: flex;
  gap: 4px;
}

.enlace {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--suave);
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}

.enlace:hover {
  background: #f1f5f9;
  color: var(--texto);
}

/* RouterLink agrega esta clase a la ruta activa */
.enlace.router-link-active {
  background: #eaf4fb;
  color: var(--azul);
}

/* Sesión */
.sesion {
  display: flex;
  align-items: center;
  gap: 12px;
}

.usuario {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--suave);
  white-space: nowrap;
}

.salir {
  padding: 6px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #fff;
  color: var(--texto);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.salir:hover {
  background: #f1f5f9;
}

.marca:focus-visible,
.enlace:focus-visible,
.salir:focus-visible {
  outline: 2px solid var(--azul);
  outline-offset: 2px;
}

/* Contenido principal */
.contenido {
  width: 100%;
  box-sizing: border-box;
}

@media (max-width: 700px) {
  .barra-interior {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 16px;
  }

  .menu {
    flex-wrap: wrap;
  }
}
</style>