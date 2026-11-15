<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'
import { evaluar, type CampoVital, type Nivel } from '../vitalRanges'
import { etiquetaUbicacion, formatearFechaHora } from '../formato'
import type { VitalSigns } from '../types'

const store = useEnfermeriaStore()

const busqueda = ref('')
const soloAlertas = ref(false)

const filtrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  return store.signosVitales.filter((r) => {
    if (soloAlertas.value && !r.isCriticalAlert) return false
    if (!q) return true
    // Se busca sobre lo que el usuario ve en pantalla ("Hab 302", "Consultorio"), así que "hab" o "302" funcionan.
    return (
      String(r.patientId).toLowerCase().includes(q) ||
      etiquetaUbicacion(r.roomNumber).toLowerCase().includes(q)
    )
  })
})

const cantidadAlertas = computed(() => store.signosVitales.filter((r) => r.isCriticalAlert).length)

function claseCelda(campo: CampoVital, valor: number) {
  const n: Nivel = evaluar(campo, valor)
  return n === 'critical' ? 'cell-critical' : n === 'warn' ? 'cell-warn' : ''
}

/** Estado de la fila: la alerta la decide el backend; "Revisar" es solo una ayuda visual. */
function estado(r: VitalSigns): { texto: string; clase: string } {
  if (r.isCriticalAlert) return { texto: 'Alerta', clase: 'badge-critical' }
  const fuera =
    evaluar('systolic', r.bloodPressureSystolic) !== 'ok' ||
    evaluar('diastolic', r.bloodPressureDiastolic) !== 'ok' ||
    evaluar('heartRate', r.heartRate) !== 'ok' ||
    evaluar('temperature', r.temperature) !== 'ok'
  return fuera ? { texto: 'Revisar', clase: 'badge-warn' } : { texto: 'Normal', clase: 'badge-ok' }
}
</script>

<template>
  <section class="panel" aria-labelledby="vs-historial">
    <div class="panel-head">
      <h2 id="vs-historial">Historial de controles</h2>
      <p class="hint">
        {{ store.signosVitales.length }} registros
        <template v-if="cantidadAlertas"> · {{ cantidadAlertas }} con alerta</template>
      </p>
    </div>

    <div class="filters">
      <div class="field">
        <label for="vs-buscar">Buscar por paciente o ubicación</label>
        <input id="vs-buscar" v-model="busqueda" type="text" autocomplete="off" />
      </div>
      <label class="check">
        <input v-model="soloAlertas" type="checkbox" />
        Solo alertas
      </label>
    </div>

    <p v-if="store.cargando && !store.signosVitales.length" class="empty">Cargando registros…</p>
    <p v-else-if="!store.signosVitales.length" class="empty">
      Todavía no hay controles. Registrá el primero con el formulario de arriba.
    </p>
    <p v-else-if="!filtrados.length" class="empty">Ningún registro coincide con el filtro.</p>

    <div v-else class="table-wrap">
      <table class="data">
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>Paciente</th>
            <th>Ubicación</th>
            <th>Presión</th>
            <th>Pulso</th>
            <th>Temp.</th>
            <th>Enfermero/a</th>
            <th>Estado</th>
            <th>Nota de enfermería</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in filtrados" :key="r.id" :class="{ 'row-critical': r.isCriticalAlert }">
            <td>{{ formatearFechaHora(r.recordedAt) }}</td>
            <td>{{ r.patientId }}</td>
            <td>{{ etiquetaUbicacion(r.roomNumber) }}</td>
            <td :class="claseCelda('systolic', r.bloodPressureSystolic)">
              {{ r.bloodPressureSystolic }}/{{ r.bloodPressureDiastolic }}
            </td>
            <td :class="claseCelda('heartRate', r.heartRate)">{{ r.heartRate }} lpm</td>
            <td :class="claseCelda('temperature', r.temperature)">{{ r.temperature }} °C</td>
            <td>{{ r.nurseName }}</td>
            <td>
              <span class="badge" :class="estado(r).clase">{{ estado(r).texto }}</span>
            </td>
            <td>{{ r.nursingNote ?? '—' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 1rem 1.5rem;
  margin-bottom: 1rem;
}

.filters .field {
  width: min(100%, 280px);
}

.check {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
  padding-bottom: 0.55rem;
}
</style>
