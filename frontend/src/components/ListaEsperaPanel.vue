<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiFetch } from '../api'
import { API_URL } from '../config'
import DatosPacienteForm from './DatosPaciente.vue'
import { pacienteVacio, datosParaEnviar, type CoberturaOpcion } from './datosPaciente'

// HU 1.3: la recepción anota pacientes en la lista de espera de un profesional para un día.
// Si se cancela un turno de ese día, el backend le asigna el horario al primero de la lista.

interface MedicoOpcion {
  id: number
  nombre: string
  especialidad: string
}

interface EntradaLista {
  id: number
  posicion: number
  pacienteNombre: string
  documento: string
  fechaAlta: string
}

const props = defineProps<{
  medicos: MedicoOpcion[]
  coberturas: CoberturaOpcion[]
  // El padre lo incrementa cuando cancela un turno: la lista pudo haber cambiado
  refresco: number
}>()

const URL_LISTA = `${API_URL}/admision/lista-espera`

const hoy = () => new Date().toLocaleDateString('en-CA') // YYYY-MM-DD en hora local

const medicoId = ref<number | null>(null)
const fecha = ref(hoy())
const paciente = ref(pacienteVacio())
const lista = ref<EntradaLista[]>([])
const cargando = ref(false)
const guardando = ref(false)
const aviso = ref<{ tipo: 'ok' | 'error'; texto: string } | null>(null)

const leerError = async (res: Response, porDefecto: string) => {
  try {
    const data = await res.json()
    return Array.isArray(data.message) ? data.message.join(', ') : data.message || porDefecto
  } catch {
    return porDefecto
  }
}

const formatearHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

const cargarLista = async () => {
  if (!medicoId.value || !fecha.value) {
    lista.value = []
    return
  }
  cargando.value = true
  try {
    const params = new URLSearchParams({ medicoId: String(medicoId.value), fecha: fecha.value })
    const res = await apiFetch(`${URL_LISTA}?${params}`)
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo obtener la lista de espera.'))
    lista.value = await res.json()
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message }
  } finally {
    cargando.value = false
  }
}

const agregar = async () => {
  if (!medicoId.value) return
  guardando.value = true
  aviso.value = null
  try {
    const res = await apiFetch(URL_LISTA, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...datosParaEnviar(paciente.value),
        medicoId: medicoId.value,
        fecha: fecha.value,
      }),
    })
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo agregar a la lista de espera.'))

    const entrada: EntradaLista = await res.json()
    aviso.value = {
      tipo: 'ok',
      texto: `${entrada.pacienteNombre} quedó en la posición ${entrada.posicion} de la lista de espera.`,
    }
    paciente.value = pacienteVacio()
    await cargarLista()
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message }
  } finally {
    guardando.value = false
  }
}

const quitar = async (entrada: EntradaLista) => {
  if (!confirm(`¿Sacar a ${entrada.pacienteNombre} de la lista de espera?`)) return
  aviso.value = null
  try {
    const res = await apiFetch(`${URL_LISTA}/${entrada.id}/retirar`, { method: 'PATCH' })
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo quitar de la lista.'))
    await cargarLista()
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message }
  }
}

// Elegir el primer profesional cuando llega la lista desde el padre
watch(
  () => props.medicos,
  (medicos) => {
    if (!medicoId.value && medicos.length) medicoId.value = medicos[0]!.id
  },
  { immediate: true },
)

watch([medicoId, fecha], cargarLista, { immediate: true })
watch(() => props.refresco, cargarLista)
</script>

<template>
  <section class="tarjeta">
    <h2>Lista de Espera</h2>
    <p class="nota explicacion">
      Si se cancela un turno de ese profesional ese día, el horario se asigna automáticamente al
      primero de la lista.
    </p>

    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">{{ aviso.texto }}</p>

    <form class="form-lista" @submit.prevent="agregar">
      <div class="fila">
        <label>
          Profesional
          <select v-model.number="medicoId" required>
            <option v-for="m in medicos" :key="m.id" :value="m.id">
              {{ m.nombre }} — {{ m.especialidad }}
            </option>
          </select>
        </label>

        <label>
          Fecha
          <input v-model="fecha" type="date" :min="hoy()" required />
        </label>
      </div>

      <DatosPacienteForm v-model="paciente" :coberturas="coberturas" buscar-por-dni />

      <div class="fila fila-final">
        <span class="nota">{{ lista.length }} en espera</span>
        <button type="submit" class="btn btn-primario" :disabled="guardando || !medicoId">
          {{ guardando ? 'Agregando…' : 'Agregar a la lista' }}
        </button>
      </div>
    </form>

    <p v-if="cargando && !lista.length" class="nota">Cargando lista…</p>
    <p v-else-if="!lista.length" class="nota">Nadie en espera para ese profesional y fecha.</p>

    <div v-else class="tabla-wrap">
      <table class="tabla">
        <thead>
          <tr>
            <th>Posición</th>
            <th>Paciente</th>
            <th>DNI</th>
            <th>Anotado a las</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="e in lista" :key="e.id">
            <td>
              <span class="id-chip">{{ e.posicion }}</span>
            </td>
            <td class="fuerte">{{ e.pacienteNombre }}</td>
            <td>{{ e.documento }}</td>
            <td>{{ formatearHora(e.fechaAlta) }}</td>
            <td>
              <button type="button" class="btn btn-quitar" @click="quitar(e)">Quitar</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
/* Las variables (--azul, --borde, ...) vienen de .vista en AdmisionView */
h2 {
  margin: 0 0 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--borde, #e2e8f0);
  font-size: 1.1rem;
}

.explicacion {
  margin-bottom: 16px;
}

.form-lista {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
}

.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.fila > label {
  flex: 1 1 180px;
}

.fila-final {
  justify-content: space-between;
  align-items: center;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--suave, #64748b);
}

select,
input {
  padding: 10px 12px;
  border: 1px solid var(--borde, #e2e8f0);
  border-radius: 6px;
  font: inherit;
  font-weight: 400;
  color: var(--texto, #1e293b);
  background: #fff;
}

.nota {
  margin: 0;
  font-size: 0.9rem;
  color: var(--suave, #64748b);
}

.aviso {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.9rem;
}

.aviso.ok {
  background: #f0fdf4;
  border-color: #bbf7d0;
  color: #166534;
}

.aviso.error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.btn {
  padding: 9px 18px;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primario {
  background: var(--azul, #0a7bc4);
  border-color: var(--azul, #0a7bc4);
  color: #fff;
}

.btn-primario:hover:not(:disabled) {
  background: var(--azul-oscuro, #0866a2);
}

.btn-quitar {
  padding: 5px 12px;
  background: #fff;
  border-color: #fecaca;
  color: #b91c1c;
  font-size: 0.8rem;
}

.btn-quitar:hover {
  background: #fef2f2;
}

.tabla-wrap {
  overflow-x: auto;
  border: 1px solid var(--borde, #e2e8f0);
  border-radius: 8px;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.tabla th {
  padding: 12px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid var(--borde, #e2e8f0);
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
  color: #475569;
}

.tabla td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--borde, #e2e8f0);
}

.tabla tbody tr:last-child td {
  border-bottom: 0;
}

.fuerte {
  font-weight: 700;
}

.id-chip {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.8rem;
  font-weight: 700;
}
</style>
