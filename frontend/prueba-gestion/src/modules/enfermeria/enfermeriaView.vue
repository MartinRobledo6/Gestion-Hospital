<script setup lang="ts">
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import NurseSession from './components/NurseSession.vue'
import { useEnfermeriaStore } from './useEnfermeriaStore'

// Esta vista es el "marco" del módulo: cabecera, navegación y avisos.
// Cada pestaña es una ruta hija que se dibuja en <RouterView />.
const store = useEnfermeriaStore()

let timer: number | undefined
onMounted(() => {
  store.cargarTodo()
  // Los avisos al médico llegan "solos": consultamos cada 15 s mientras la pantalla está abierta.
  timer = window.setInterval(() => store.refrescarAvisos(), 15_000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="shell">
    <header class="top">
      <div class="top-inner">
        <h1>Atención y Enfermería</h1>
        <NurseSession />
      </div>
      <nav class="tabs" aria-label="Secciones de enfermería">
        <RouterLink to="/enfermeria/signos-vitales">Signos vitales</RouterLink>
        <RouterLink to="/enfermeria/medicacion">Medicación</RouterLink>
        <RouterLink to="/enfermeria/alertas">
          Alertas al médico
          <span v-if="store.sinLeer" class="count" aria-label="sin leer">{{ store.sinLeer }}</span>
        </RouterLink>
        <RouterLink to="/enfermeria/protocolos">Protocolos de ingreso</RouterLink>
      </nav>
    </header>

    <main class="content">
      <div
        v-if="store.aviso"
        class="notice"
        :class="`notice-${store.aviso.tipo}`"
        :role="store.aviso.tipo === 'exito' ? 'status' : 'alert'"
      >
        <p>{{ store.aviso.texto }}</p>
        <button type="button" class="btn btn-quiet" @click="store.limpiarAviso">Cerrar</button>
      </div>

      <div v-if="store.errorCarga" class="notice notice-error" role="alert">
        <p>{{ store.errorCarga }}</p>
        <button type="button" class="btn btn-quiet" @click="store.cargarTodo">Reintentar</button>
      </div>

      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.top {
  background: var(--surface);
  border-bottom: 1px solid var(--line);
}

.top-inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1rem 1.25rem 0.5rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1.5rem;
}

h1 {
  font-size: 1.375rem;
  font-weight: 700;
  color: var(--brand-dark);
}

.tabs {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 1.25rem;
  display: flex;
  gap: 0.25rem;
  overflow-x: auto;
}

.tabs a {
  padding: 0.6rem 0.9rem;
  color: var(--muted);
  text-decoration: none;
  font-weight: 600;
  border-bottom: 3px solid transparent;
  white-space: nowrap;
}

.count {
  display: inline-block;
  min-width: 1.25rem;
  padding: 0 0.35rem;
  margin-left: 0.25rem;
  border-radius: 999px;
  background: var(--critical);
  color: #fff;
  font-size: 0.75rem;
  text-align: center;
}

.tabs a:hover {
  color: var(--ink);
}

.tabs a.router-link-active {
  color: var(--brand-dark);
  border-bottom-color: var(--brand);
}

.content {
  max-width: 1100px;
  margin: 0 auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 1rem;
  border-radius: var(--radius);
  border: 1px solid;
}

.notice p {
  font-weight: 600;
}

.notice-exito {
  background: var(--ok-soft);
  border-color: var(--ok);
  color: var(--ok);
}

.notice-alerta {
  background: var(--critical);
  border-color: var(--critical);
  color: #fff;
}

.notice-alerta .btn-quiet {
  color: #fff;
  border-color: #fff;
}

.notice-alerta .btn-quiet:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.18);
}

.notice-error {
  background: var(--critical-soft);
  border-color: var(--critical);
  color: var(--critical);
}
</style>
