<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'
import { formatearFechaHora } from '../formato'

const store = useEnfermeriaStore()

const busqueda = ref('')

const filtradas = computed(() => {
  const q = busqueda.value.trim()
  if (!q) return store.administraciones
  return store.administraciones.filter((a) => String(a.indicationId).includes(q))
})
</script>

<template>
  <section class="panel" aria-labelledby="med-historial">
    <div class="panel-head">
      <h2 id="med-historial">Historial de administraciones</h2>
      <p class="hint">{{ store.administraciones.length }} registros</p>
    </div>

    <div class="field search">
      <label for="med-buscar">Buscar por número de indicación</label>
      <input
        id="med-buscar"
        v-model="busqueda"
        type="text"
        inputmode="numeric"
        autocomplete="off"
      />
    </div>

    <p v-if="store.cargando && !store.administraciones.length" class="empty">Cargando registros…</p>
    <p v-else-if="!store.administraciones.length" class="empty">
      Todavía no se registró ninguna administración.
    </p>
    <p v-else-if="!filtradas.length" class="empty">Ningún registro coincide con la búsqueda.</p>

    <div v-else class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Dosis programada</th>
            <th>Registrada</th>
            <th>Indicación</th>
            <th>Enfermero/a</th>
            <th>Resultado</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in filtradas" :key="a.id">
            <td>{{ a.scheduledAt ? formatearFechaHora(a.scheduledAt) : '—' }}</td>
            <td>{{ formatearFechaHora(a.administeredAt) }}</td>
            <td>#{{ a.indicationId }}</td>
            <td>{{ a.nurseName ?? `ID ${a.nurseId}` }}</td>
            <td>
              <span
                class="badge"
                :class="a.status === 'Administrada' ? 'badge-ok' : 'badge-warn'"
                >{{ a.status }}</span
              >
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.search {
  width: min(100%, 280px);
  margin-bottom: 1rem;
}
</style>
