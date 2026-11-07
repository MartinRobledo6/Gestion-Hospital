<script setup lang="ts">
import { ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'

// Simula la "orden del médico" (el módulo médico no existe todavía): crea la indicación
// con su frecuencia y el insumo que consume. A partir de ahí el servidor calcula las dosis.
const store = useEnfermeriaStore()

const paciente = ref({ id: '', nombre: '' })
const medicacion = ref('')
const dosis = ref('')
const cadaHoras = ref<string | number>(8)
const primera = ref('')
const insumoId = ref<number | ''>('')
const error = ref('')

async function guardar() {
  const horas = Number(cadaHoras.value)
  if (!paciente.value.id.trim() || !paciente.value.nombre.trim()) return (error.value = 'Completá ID y nombre del paciente.')
  if (!medicacion.value.trim() || !dosis.value.trim()) return (error.value = 'Completá medicamento y dosis.')
  if (!Number.isInteger(horas) || horas < 1 || horas > 24) return (error.value = 'La frecuencia debe ser entre 1 y 24 horas.')
  if (!primera.value) return (error.value = 'Elegí el horario de la primera dosis.')
  if (insumoId.value === '') return (error.value = 'Elegí el insumo que se descuenta (cargalo antes si no existe).')
  error.value = ''
  const ok = await store.crearIndicacion({
    patientId: paciente.value.id.trim(),
    patientName: paciente.value.nombre.trim(),
    medication: medicacion.value.trim(),
    dose: dosis.value.trim(),
    everyHours: horas,
    // datetime-local no trae zona horaria: new Date() lo interpreta como hora local.
    firstDoseAt: new Date(primera.value).toISOString(),
    supplyId: insumoId.value,
  })
  if (ok) {
    medicacion.value = ''
    dosis.value = ''
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
          <input id="in-pid" v-model="paciente.id" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="in-pnom">Nombre del paciente</label>
          <input id="in-pnom" v-model="paciente.nombre" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="in-med">Medicamento</label>
          <input id="in-med" v-model="medicacion" type="text" autocomplete="off" />
        </div>
        <div class="field">
          <label for="in-dosis">Dosis</label>
          <input id="in-dosis" v-model="dosis" type="text" placeholder="500 mg" autocomplete="off" />
        </div>
        <div class="field">
          <label for="in-horas">Cada (horas)</label>
          <input id="in-horas" v-model="cadaHoras" type="number" min="1" max="24" step="1" />
        </div>
        <div class="field">
          <label for="in-primera">Primera dosis</label>
          <input id="in-primera" v-model="primera" type="datetime-local" />
        </div>
        <div class="field">
          <label for="in-insumo">Insumo que se descuenta</label>
          <select id="in-insumo" v-model="insumoId">
            <option value="">Elegir…</option>
            <option v-for="s in store.inventario" :key="s.id" :value="s.id">{{ s.name }} (stock {{ s.stock }})</option>
          </select>
        </div>
        <div class="field acc">
          <button type="submit" class="btn">Crear indicación</button>
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
