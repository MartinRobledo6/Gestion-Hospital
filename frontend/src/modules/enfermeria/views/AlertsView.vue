<script setup lang="ts">
import { useEnfermeriaStore } from '../useEnfermeriaStore'
import { formatearFechaHora } from '../formato'

// Bandeja del médico de guardia. Cuando haya módulo médico/IAM esto vive allá;
// por ahora sirve para comprobar que la alerta crítica (> 39 °C) realmente se envió.
const store = useEnfermeriaStore()
</script>

<template>
  <section class="panel" aria-labelledby="al-titulo">
    <div class="panel-head">
      <h2 id="al-titulo">Alertas al médico de guardia</h2>
      <p class="hint">{{ store.sinLeer }} sin leer</p>
    </div>

    <p v-if="!store.notificaciones.length" class="empty">No hay alertas.</p>
    <ul v-else class="lista">
      <li v-for="n in store.notificaciones" :key="n.id" :class="{ leida: n.read }">
        <div>
          <span class="badge badge-critical">Prioridad {{ n.priority }}</span>
          <span class="hint"> · para {{ n.recipientRole }} · {{ formatearFechaHora(n.createdAt) }}</span>
          <p>{{ n.message }}</p>
        </div>
        <button v-if="!n.read" type="button" class="btn btn-quiet" @click="store.marcarLeida(n.id)">
          Marcar como leída
        </button>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.lista {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.lista li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  border: 1px solid var(--critical);
  background: var(--critical-soft);
  border-radius: 6px;
  padding: 0.8rem 1rem;
}
.lista li.leida {
  border-color: var(--line);
  background: transparent;
  color: var(--muted);
}
.lista p {
  margin: 0.35rem 0 0;
  font-weight: 600;
}
</style>
