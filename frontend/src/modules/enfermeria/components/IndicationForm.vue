<script setup lang="ts">
import { ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'

const store = useEnfermeriaStore()

const pacienteId = ref<string | number>('')
const medicoId = ref<string | number>('')
const dosis = ref('')
const cadaHoras = ref<string | number>(8)
const primera = ref('')
const insumoId = ref<number | ''>('')
const error = ref('')
const enviando = ref(false)

async function guardar() {
  const paciente = Number(pacienteId.value)
  const medico = Number(medicoId.value)
  const horas = Number(cadaHoras.value)

  if (!Number.isInteger(paciente) || paciente < 1) {
    error.value = 'Ingresá un ID de paciente válido.'
    return
  }

  if (!Number.isInteger(medico) || medico < 1) {
    error.value = 'Ingresá un ID de médico válido.'
    return
  }

  if (!dosis.value.trim()) {
    error.value = 'Ingresá la dosis.'
    return
  }

  if (!Number.isInteger(horas) || horas < 1 || horas > 48) {
    error.value = 'La frecuencia debe ser entre 1 y 48 horas.'
    return
  }

  if (!primera.value) {
    error.value = 'Elegí el horario de la primera dosis.'
    return
  }

  if (insumoId.value === '') {
    error.value = 'Seleccioná un insumo del inventario.'
    return
  }

  error.value = ''
  enviando.value = true

  const ok = await store.crearIndicacion({
    patientId: paciente,
    medicoId: medico,
    supplyId: insumoId.value,
    dose: dosis.value.trim(),
    everyHours: horas,
    firstDoseAt: new Date(primera.value).toISOString(),
  })

  enviando.value = false

  if (ok) {
    dosis.value = ''
    pacienteId.value = ''
    medicoId.value = ''
    primera.value = ''
  }
}
</script>

<template>
  <section class="panel" aria-labelledby="ind-titulo">
    <details>
      <summary id="ind-titulo">Crear indicación médica (datos de prueba)</summary>

      <form class="form-grid" novalidate @submit.prevent="guardar">
        <div class="field">
          <label for="in-pid">ID del paciente</label>
          <input id="in-pid" v-model="pacienteId" type="number" min="1" step="1" />
        </div>

        <div class="field">
          <label for="in-medico">ID del médico</label>
          <input id="in-medico" v-model="medicoId" type="number" min="1" step="1" />
        </div>

        <div class="field">
          <label for="in-dosis">Dosis</label>
          <input
            id="in-dosis"
            v-model="dosis"
            type="text"
            placeholder="500 mg"
            autocomplete="off"
          />
        </div>

        <div class="field">
          <label for="in-horas">Cada (horas)</label>
          <input id="in-horas" v-model="cadaHoras" type="number" min="1" max="48" step="1" />
        </div>

        <div class="field">
          <label for="in-primera">Primera dosis</label>
          <input id="in-primera" v-model="primera" type="datetime-local" />
        </div>

        <div class="field">
          <label for="in-insumo">Medicamento / insumo</label>
          <select id="in-insumo" v-model="insumoId">
            <option value="">Elegir...</option>
            <option v-for="s in store.inventario" :key="s.id" :value="s.id" :disabled="s.stock < 1">
              {{ s.name }} (stock {{ s.stock }})
            </option>
          </select>
        </div>

        <div class="field acc">
          <button type="submit" class="btn" :disabled="enviando">
            {{ enviando ? 'Guardando...' : 'Crear indicación' }}
          </button>
        </div>
      </form>

      <p v-if="error" class="field-error" role="alert">{{ error }}</p>
    </details>
  </section>
</template>

<style scoped>
summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--brand-dark);
  margin-bottom: 0.75rem;
}

.acc {
  justify-content: flex-end;
}
</style>
