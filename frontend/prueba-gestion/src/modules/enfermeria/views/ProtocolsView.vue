<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'
import { etiquetaUbicacion, formatearFechaHora } from '../formato'

// Protocolos de ingreso (HU 2.1). El backend arma las tareas con el Builder según el motivo.
// En el sistema final el ingreso lo dispara el módulo de Admisión; acá el formulario
// simula ese evento para poder probar el flujo completo.
const store = useEnfermeriaStore()

const pacienteId = ref('')
const habitacion = ref('')
const motivo = ref('')
const error = ref('')

const seleccionado = computed(() => store.motivosIngreso.find((m) => m.value === motivo.value))

async function admitir() {
  if (!pacienteId.value.trim() || !habitacion.value.trim()) {
    error.value = 'Ingresá el ID del paciente y la habitación.'
    return
  }
  if (!motivo.value) {
    error.value = 'Elegí el motivo de ingreso.'
    return
  }
  error.value = ''
  const ok = await store.admitirPaciente({
    patientId: pacienteId.value.trim(),
    roomNumber: habitacion.value.trim(),
    reason: motivo.value,
  })
  if (ok) pacienteId.value = ''
}

function progreso(tareas: { completed: boolean }[]) {
  return `${tareas.filter((t) => t.completed).length}/${tareas.length}`
}
</script>

<template>
  <div class="stack">
    <form class="panel" novalidate @submit.prevent="admitir">
      <div class="panel-head">
        <h2>Ingreso de paciente (simulado)</h2>
        <p class="hint">Al admitir, el sistema genera solo el plan de cuidados.</p>
      </div>

      <div class="form-grid">
        <div class="field">
          <label for="pr-paciente">ID del paciente</label>
          <input id="pr-paciente" v-model="pacienteId" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="pr-hab">Habitación</label>
          <input id="pr-hab" v-model="habitacion" type="text" autocomplete="off" placeholder="302" />
        </div>
        <div class="field">
          <label for="pr-motivo">Motivo de ingreso</label>
          <select id="pr-motivo" v-model="motivo">
            <option value="">Elegir…</option>
            <option v-for="m in store.motivosIngreso" :key="m.value" :value="m.value">{{ m.label }}</option>
          </select>
        </div>
      </div>

      <div v-if="seleccionado" class="preview">
        <h3>{{ seleccionado.type }}: tareas que se van a crear</h3>
        <ul>
          <li v-for="t in seleccionado.tasks" :key="t">{{ t }}</li>
        </ul>
      </div>

      <p v-if="error" class="field-error" role="alert" style="margin-top: 0.75rem">{{ error }}</p>
      <div style="margin-top: 1.25rem">
        <button type="submit" class="btn">Admitir y generar protocolo</button>
      </div>
    </form>

    <section class="panel" aria-labelledby="pr-lista">
      <div class="panel-head">
        <h2 id="pr-lista">Protocolos activos</h2>
        <p class="hint">{{ store.protocolos.length }} en total</p>
      </div>

      <p v-if="!store.protocolos.length" class="empty">Todavía no se generó ningún protocolo.</p>
      <ul v-else class="protocolos">
        <li v-for="p in store.protocolos" :key="p.id" class="protocolo">
          <div class="protocolo-head">
            <div>
              <strong>{{ p.type }}</strong>
              <div class="hint">
                Paciente {{ p.patientId }} · {{ etiquetaUbicacion(p.roomNumber) }} · {{ formatearFechaHora(p.startedAt) }}
              </div>
            </div>
            <span class="badge badge-brand">{{ progreso(p.tasks) }} tareas</span>
          </div>
          <ul class="tareas">
            <li v-for="t in p.tasks" :key="t.id">
              <label :class="{ hecha: t.completed }">
                <input type="checkbox" :checked="t.completed" @change="store.marcarTarea(t.id, ($event.target as HTMLInputElement).checked)" />
                {{ t.description }}
              </label>
            </li>
          </ul>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.preview {
  margin-top: 1rem;
}
.preview ul,
.tareas,
.protocolos {
  margin: 0.5rem 0 0;
  padding: 0;
  list-style: none;
}
.preview li {
  padding: 0.15rem 0;
}
.preview li::before {
  content: '–';
  margin-right: 0.5rem;
  color: var(--muted);
}
.protocolos {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.protocolo {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0.9rem 1rem;
}
.protocolo-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.tareas label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
}
.tareas label.hecha {
  color: var(--muted);
  text-decoration: line-through;
}
</style>
