<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { http } from '@/api/http'

interface PacienteOpcion {
  Id: number
  Nombre: string
  Apellido: string
  Documento: string
}

// v-model del componente: el ID del paciente elegido (null = ninguno).
const pacienteId = defineModel<number | null>({ required: true })

defineProps<{ id?: string }>()

const pacientes = ref<PacienteOpcion[]>([])
const cargando = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    pacientes.value = await http<PacienteOpcion[]>('/hce/pacientes')
  } catch {
    error.value = 'No se pudieron cargar los pacientes'
  } finally {
    cargando.value = false
  }
})
</script>

<template>
  <select :id="id" v-model="pacienteId" class="input" :disabled="cargando || !!error">
    <option :value="null" disabled>
      {{ cargando ? 'Cargando pacientes…' : error || 'Seleccioná un paciente' }}
    </option>
    <option v-for="p in pacientes" :key="p.Id" :value="p.Id">
      {{ p.Apellido }}, {{ p.Nombre }} — DNI {{ p.Documento }}
    </option>
  </select>
</template>
