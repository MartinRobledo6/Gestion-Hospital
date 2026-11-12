<script setup lang="ts">
import { ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'

// Sustituto temporal del login (módulo IAM, todavía no existe):
// el backend pide nurseId (número) y nurseName (texto), así que los pedimos una vez.
const store = useEnfermeriaStore()

const editando = ref(store.enfermero === null)
const nombre = ref(store.enfermero?.nombre ?? '')
const id = ref<string | number>(store.enfermero ? store.enfermero.id : '')
const error = ref('')

function guardar() {
  const idNum = Number(id.value)
  if (!nombre.value.trim()) {
    error.value = 'Ingresá el nombre.'
  } else if (!Number.isInteger(idNum) || idNum <= 0) {
    error.value = 'El ID debe ser un número entero positivo.'
  } else {
    store.enfermero = { id: idNum, nombre: nombre.value.trim() }
    error.value = ''
    editando.value = false
  }
}
</script>

<template>
  <form v-if="editando" class="session-form" @submit.prevent="guardar">
    <div class="field">
      <label for="ns-nombre">Enfermero/a de turno</label>
      <input id="ns-nombre" v-model="nombre" type="text" placeholder="Martín Torres" autocomplete="off" />
    </div>
    <div class="field id">
      <label for="ns-id">ID</label>
      <input id="ns-id" v-model="id" type="number" min="1" step="1" placeholder="12" />
    </div>
    <button type="submit" class="btn">Iniciar turno</button>
    <p v-if="error" class="field-error" role="alert">{{ error }}</p>
  </form>

  <div v-else class="session-chip">
    <span>
      <strong>{{ store.enfermero?.nombre }}</strong>
      <span class="hint"> · ID {{ store.enfermero?.id }}</span>
    </span>
    <button type="button" class="btn btn-quiet" @click="editando = true">Cambiar</button>
  </div>
</template>

<style scoped>
.session-form {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.session-form .field.id {
  width: 90px;
}

.session-form .field-error {
  flex-basis: 100%;
}

.session-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
