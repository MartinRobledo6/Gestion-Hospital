<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiFetch } from '../api'
import { API_URL } from '../config'
import { usePolling } from '../composable/usepolling'

// HU 1.3: "alertar al recepcionista para que llame por altavoz o notifique al paciente".
// Muestra a los pacientes que recibieron un turno desde la lista de espera y todavía
// no fueron avisados. Se consulta cada 10 s: la cancelación pudo hacerla otra persona.

interface Aviso {
  id: number
  pacienteNombre: string
  documento: string
  medicoNombre: string
  fechaHoraInicio: string | null
}

const props = defineProps<{ refresco: number }>()

const URL_LISTA = `${API_URL}/admision/lista-espera`
const INTERVALO_MS = 10_000

const avisos = ref<Aviso[]>([])
const error = ref<string | null>(null)

const formatearTurno = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'horario a confirmar'

const cargar = async () => {
  try {
    const res = await apiFetch(`${URL_LISTA}/avisos`)
    if (!res.ok) return // sin permiso o backend caído: el banner simplemente no aparece
    avisos.value = await res.json()
  } catch {
    // sin conexión: se reintenta en el próximo ciclo
  }
}

const marcarAvisado = async (aviso: Aviso) => {
  error.value = null
  try {
    const res = await apiFetch(`${URL_LISTA}/${aviso.id}/notificado`, { method: 'PATCH' })
    if (!res.ok) throw new Error('No se pudo marcar como avisado.')
    avisos.value = avisos.value.filter((a) => a.id !== aviso.id)
  } catch (err: any) {
    error.value = err.message
  }
}

usePolling(cargar, INTERVALO_MS)
watch(() => props.refresco, cargar) // el padre acaba de cancelar un turno: no esperar 10 s
</script>

<template>
  <div v-if="avisos.length" class="avisos" role="alert">
    <strong class="titulo">Turnos asignados desde la lista de espera: avisale al paciente</strong>
    <ul>
      <li v-for="a in avisos" :key="a.id">
        <span>
          <b>{{ a.pacienteNombre }}</b> (DNI {{ a.documento }}) tiene turno con
          <b>{{ a.medicoNombre }}</b> el {{ formatearTurno(a.fechaHoraInicio) }}.
        </span>
        <button type="button" class="btn-avisado" @click="marcarAvisado(a)">Ya le avisé</button>
      </li>
    </ul>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<style scoped>
.avisos {
  margin: 0 0 24px;
  padding: 14px 16px;
  border: 1px solid #fcd34d;
  border-left: 4px solid #f59e0b;
  border-radius: 8px;
  background: #fffbeb;
  color: #78350f;
}

.titulo {
  display: block;
  margin-bottom: 8px;
}

ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

li {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  font-size: 0.92rem;
}

.btn-avisado {
  padding: 5px 12px;
  border: 1px solid #f59e0b;
  border-radius: 6px;
  background: #fff;
  color: #92400e;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.btn-avisado:hover {
  background: #fef3c7;
}

.error {
  margin: 8px 0 0;
  color: #991b1b;
  font-size: 0.85rem;
}
</style>
