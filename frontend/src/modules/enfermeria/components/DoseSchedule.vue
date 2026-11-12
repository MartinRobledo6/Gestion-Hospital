<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'
import { formatearHora } from '../formato'
import type { Dose, ScheduleItem } from '../types'

// Dosis que tocan HOY según las indicaciones activas (HU 1.2).
// Los botones se habilitan según el reloj de esta PC, pero la regla real (+/- 30 min)
// la valida el servidor: si los relojes difieren, el backend rechaza y lo mostramos.
const store = useEnfermeriaStore()

const ahora = ref(Date.now())
let timer: number | undefined
onMounted(() => (timer = window.setInterval(() => (ahora.value = Date.now()), 15_000)))
onBeforeUnmount(() => window.clearInterval(timer))

const enviando = ref(false)

function puedeAdministrar(d: Dose): boolean {
  return (
    d.status === 'Pendiente' &&
    ahora.value >= Date.parse(d.windowStart) &&
    ahora.value <= Date.parse(d.windowEnd)
  )
}
function puedeOmitir(d: Dose): boolean {
  return d.status === 'Pendiente' && ahora.value >= Date.parse(d.windowStart)
}
function etiqueta(d: Dose): { texto: string; clase: string } {
  if (d.status === 'Administrada') return { texto: 'Administrada', clase: 'badge-ok' }
  if (d.status === 'Omitida') return { texto: 'Omitida', clase: 'badge-warn' }
  if (ahora.value < Date.parse(d.windowStart)) return { texto: 'Programada', clase: '' }
  if (ahora.value <= Date.parse(d.windowEnd))
    return { texto: 'Para administrar ahora', clase: 'badge-brand' }
  return { texto: 'Vencida', clase: 'badge-critical' }
}

async function confirmar(item: ScheduleItem, d: Dose, status: 'Administrada' | 'Omitida') {
  if (!store.enfermero) {
    store.aviso = {
      tipo: 'error',
      texto: 'Iniciá el turno (nombre e ID del enfermero/a) antes de registrar dosis.',
    }
    return
  }
  enviando.value = true
  await store.registrarAdministracion({
    indicationId: item.indication.id,
    nurseId: store.enfermero.id,
    status,
    scheduledAt: d.scheduledAt,
  })
  enviando.value = false
}

const hayIndicaciones = computed(() => store.cronograma.length > 0)
</script>

<template>
  <section class="panel" aria-labelledby="dosis-titulo">
    <div class="panel-head">
      <h2 id="dosis-titulo">Dosis de hoy</h2>
      <p class="hint">Se puede registrar desde 30 min antes hasta 30 min después del horario.</p>
    </div>

    <p v-if="!hayIndicaciones" class="empty">
      No hay indicaciones activas. Cargá una más abajo para probar.
    </p>

    <div v-for="item in store.cronograma" :key="item.indication.id" class="indicacion">
      <div class="ind-head">
        <div>
          <strong>{{ item.indication.patientName }}</strong>
          <span class="hint"> · ID {{ item.indication.patientId }}</span>
          <div>
            {{ item.indication.medication }} {{ item.indication.dose }}
            <span class="hint">{{ item.indication.frequency }} h</span>
          </div>
        </div>
        <span
          v-if="item.supply"
          class="badge"
          :class="
            item.supply.stock < 1
              ? 'badge-critical'
              : item.supply.stock <= 5
                ? 'badge-warn'
                : 'badge-ok'
          "
        >
          Stock: {{ item.supply.stock }}
        </span>
      </div>

      <p v-if="!item.doses.length" class="hint">Sin dosis programadas para hoy.</p>
      <ul v-else class="doses">
        <li v-for="d in item.doses" :key="d.scheduledAt">
          <span class="hora">{{ formatearHora(d.scheduledAt) }}</span>
          <span class="badge" :class="etiqueta(d).clase">{{ etiqueta(d).texto }}</span>
          <span class="acciones">
            <button
              type="button"
              class="btn"
              :disabled="enviando || !puedeAdministrar(d)"
              @click="confirmar(item, d, 'Administrada')"
            >
              Administrar
            </button>
            <button
              type="button"
              class="btn btn-quiet"
              :disabled="enviando || !puedeOmitir(d)"
              @click="confirmar(item, d, 'Omitida')"
            >
              Omitir
            </button>
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.indicacion {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.9rem 1rem;
  margin-top: 0.9rem;
}
.ind-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: flex-start;
}
.doses {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.doses li {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.4rem 0;
  border-top: 1px solid var(--line);
  flex-wrap: wrap;
}
.hora {
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  min-width: 3.5rem;
}
.acciones {
  margin-left: auto;
  display: flex;
  gap: 0.5rem;
}
</style>
