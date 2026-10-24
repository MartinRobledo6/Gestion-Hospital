<template>
  <div class="hospital-container">
    <header class="header">
      <h2>Historia Clínica Electrónica</h2>
      <p class="subtitle">Ficha del paciente, alergias, antecedentes y evoluciones médicas</p>
    </header>

    <!-- Búsqueda -->
    <div class="card">
      <form class="search-row" @submit.prevent="buscar">
        <label for="pacienteId" class="label">ID del paciente</label>
        <input
          id="pacienteId"
          v-model.number="pacienteIdBusqueda"
          type="number"
          min="1"
          class="input"
          placeholder="Ej: 1"
        />
        <button type="submit" class="btn btn-primary">Buscar</button>
      </form>

      <p v-if="mensaje" class="aviso">{{ mensaje }}</p>
      <button v-if="sinHistoria" class="btn btn-success" @click="abrirHistoria">
        Abrir historia clínica
      </button>
    </div>

    <template v-if="historia">
      <!-- Ficha demográfica -->
      <div class="card">
        <h3 class="section-title">Ficha del paciente</h3>
        <div class="ficha-grid">
          <div>
            <span class="field-label">Paciente</span>
            <span class="field-value"
              >{{ historia.Paciente.Apellido }}, {{ historia.Paciente.Nombre }}</span
            >
          </div>
          <div>
            <span class="field-label">Documento</span>
            <span class="field-value">{{ historia.Paciente.Documento }}</span>
          </div>
          <div>
            <span class="field-label">Fecha de nacimiento</span>
            <span class="field-value">{{ formatearFecha(historia.Paciente.FechaNacimiento) }}</span>
          </div>
          <div>
            <span class="field-label">Cobertura</span>
            <span class="field-value"
              >{{ historia.Paciente.Cobertura.Nombre }} ({{
                historia.Paciente.Cobertura.TipoCobertura
              }})</span
            >
          </div>
        </div>
      </div>

      <!-- Alergias y antecedentes -->
      <div class="card">
        <h3 class="section-title">Alergias y antecedentes</h3>
        <label class="field-label" for="alergias">Alergias</label>
        <textarea id="alergias" v-model="alergiasEdit" class="input textarea" rows="2"></textarea>

        <label class="field-label" for="antecedentes">Antecedentes familiares</label>
        <textarea
          id="antecedentes"
          v-model="antecedentesEdit"
          class="input textarea"
          rows="2"
        ></textarea>

        <button class="btn btn-primary" @click="guardarFicha">Guardar cambios</button>
      </div>

      <!-- Nueva evolución -->
      <div class="card">
        <h3 class="section-title">Nueva evolución médica</h3>
        <p class="nota">Las evoluciones no se pueden editar ni borrar una vez guardadas.</p>

        <label class="field-label" for="medicoId">ID del médico</label>
        <input
          id="medicoId"
          v-model.number="medicoId"
          type="number"
          min="1"
          class="input input-corto"
        />

        <label class="field-label" for="observaciones">Observaciones</label>
        <textarea
          id="observaciones"
          v-model="observaciones"
          class="input textarea"
          rows="3"
          placeholder="Mínimo 5 caracteres"
        ></textarea>

        <button class="btn btn-success" :disabled="!evolucionValida" @click="agregarEvolucion">
          Guardar evolución
        </button>
      </div>

      <!-- Historial de evoluciones -->
      <div class="card">
        <h3 class="section-title">Evoluciones ({{ historia.Evoluciones.length }})</h3>
        <div v-for="evo in historia.Evoluciones" :key="evo.Id" class="evolucion">
          <div class="evolucion-head">
            <span class="badge-id">#{{ evo.Id }}</span>
            <span>{{ formatearFechaHora(evo.FechaHora) }}</span>
            <span>Médico #{{ evo.MedicoId }}</span>
          </div>
          <p class="evolucion-texto">{{ evo.Observaciones }}</p>
        </div>
        <p v-if="historia.Evoluciones.length === 0" class="empty-state">
          Todavía no hay evoluciones registradas.
        </p>
      </div>

      <!-- Estudios -->
      <div class="card">
        <h3 class="section-title">Estudios ({{ estudios.length }})</h3>

        <label class="field-label" for="tipoEstudio">Tipo de estudio</label>
        <select id="tipoEstudio" v-model="tipoEstudio" class="input input-medio">
          <option v-for="tipo in TIPOS_ESTUDIO" :key="tipo" :value="tipo">{{ tipo }}</option>
        </select>

        <label class="field-label" for="descripcionEstudio">Resultado / descripción</label>
        <textarea
          id="descripcionEstudio"
          v-model="descripcionEstudio"
          class="input textarea"
          rows="3"
          placeholder="Mínimo 5 caracteres"
        ></textarea>

        <label class="field-label" for="enlaceEstudio">Enlace al archivo (opcional)</label>
        <input
          id="enlaceEstudio"
          v-model="enlaceEstudio"
          type="url"
          class="input"
          placeholder="https://..."
        />

        <button class="btn btn-success" :disabled="!estudioValido" @click="agregarEstudio">
          Guardar estudio
        </button>

        <div class="lista-estudios">
          <div v-for="est in estudios" :key="est.Id" class="evolucion">
            <div class="evolucion-head">
              <span class="badge-id">#{{ est.Id }}</span>
              <strong>{{ est.TipoEstudio }}</strong>
              <span>{{ formatearFechaHora(est.FechaHora) }}</span>
            </div>
            <p class="evolucion-texto">{{ est.Descripcion }}</p>
            <a v-if="est.Enlace" :href="est.Enlace" target="_blank" rel="noopener noreferrer"
              >Ver archivo</a
            >
          </div>
          <p v-if="estudios.length === 0" class="empty-state">
            Todavía no hay estudios registrados.
          </p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

interface Cobertura {
  Nombre: string
  TipoCobertura: string
}

interface Paciente {
  Nombre: string
  Apellido: string
  Documento: string
  FechaNacimiento: string
  Cobertura: Cobertura
}

interface Evolucion {
  Id: number
  MedicoId: number
  FechaHora: string
  Observaciones: string
}

interface Estudio {
  Id: number
  TipoEstudio: string
  Descripcion: string
  Enlace: string | null
  FechaHora: string
}

interface Historia {
  Id: number
  PacienteId: number
  Alergias: string | null
  AntecedentesFamiliares: string | null
  Paciente: Paciente
  Evoluciones: Evolucion[]
}

const API = 'http://localhost:3000/hce'

const pacienteIdBusqueda = ref<number | null>(null)
const historia = ref<Historia | null>(null)
const sinHistoria = ref(false)
const mensaje = ref('')

const alergiasEdit = ref('')
const antecedentesEdit = ref('')

const medicoId = ref<number | null>(null)
const observaciones = ref('')

const TIPOS_ESTUDIO = [
  'Laboratorio',
  'Radiografía',
  'Ecografía',
  'Tomografía',
  'Resonancia',
  'Electrocardiograma',
  'Otro',
]
const estudios = ref<Estudio[]>([])
const tipoEstudio = ref('Laboratorio')
const descripcionEstudio = ref('')
const enlaceEstudio = ref('')

const estudioValido = computed(() => descripcionEstudio.value.trim().length >= 5)
const evolucionValida = computed(() => !!medicoId.value && observaciones.value.trim().length >= 5)

// La fecha de nacimiento viene como "1990-01-01": se arma a mano para evitar corrimientos de zona horaria
const formatearFecha = (fecha: string) => fecha.slice(0, 10).split('-').reverse().join('/')
const formatearFechaHora = (fecha: string) => new Date(fecha).toLocaleString('es-AR')

const leerError = async (response: Response) => {
  try {
    const data = await response.json()
    return Array.isArray(data.message) ? data.message.join('\n') : data.message
  } catch {
    return 'Error desconocido en el servidor'
  }
}

const mostrarError = (error: unknown) => {
  const texto = error instanceof Error ? error.message : 'Ocurrió un error desconocido.'
  alert(`No se pudo completar la acción:\n${texto}`)
  console.error('Detalle del error:', error)
}

const cargarEstudios = async (historiaId: number) => {
  const response = await fetch(`${API}/historia/${historiaId}/estudios`)
  if (!response.ok) throw new Error(await leerError(response))
  estudios.value = await response.json()
}

const cargarHistoria = async (pacienteId: number) => {
  const response = await fetch(`${API}/paciente/${pacienteId}`)

  if (response.status === 404) {
    historia.value = null
    estudios.value = []
    sinHistoria.value = true
    mensaje.value = `El paciente ${pacienteId} no tiene historia clínica abierta.`
    return
  }
  if (!response.ok) throw new Error(await leerError(response))

  const data: Historia = await response.json()
  historia.value = data
  sinHistoria.value = false
  mensaje.value = ''
  alergiasEdit.value = data.Alergias ?? ''
  antecedentesEdit.value = data.AntecedentesFamiliares ?? ''
  await cargarEstudios(data.Id)
}

const buscar = async () => {
  if (!pacienteIdBusqueda.value) {
    mensaje.value = 'Ingresá el ID de un paciente.'
    return
  }
  historia.value = null
  sinHistoria.value = false
  mensaje.value = ''
  try {
    await cargarHistoria(pacienteIdBusqueda.value)
  } catch (error) {
    mostrarError(error)
  }
}

const abrirHistoria = async () => {
  if (!pacienteIdBusqueda.value) return
  try {
    const response = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ PacienteId: pacienteIdBusqueda.value }),
    })
    if (!response.ok) throw new Error(await leerError(response))
    await cargarHistoria(pacienteIdBusqueda.value)
  } catch (error) {
    mostrarError(error)
  }
}

const guardarFicha = async () => {
  if (!historia.value) return
  const pacienteId = historia.value.PacienteId
  try {
    const response = await fetch(`${API}/paciente/${pacienteId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        Alergias: alergiasEdit.value,
        AntecedentesFamiliares: antecedentesEdit.value,
      }),
    })
    if (!response.ok) throw new Error(await leerError(response))
    await cargarHistoria(pacienteId)
  } catch (error) {
    mostrarError(error)
  }
}

const agregarEstudio = async () => {
  if (!historia.value || !estudioValido.value) return
  const historiaId = historia.value.Id
  const enlace = enlaceEstudio.value.trim()
  try {
    const response = await fetch(`${API}/estudio`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        HistoriaClinicaId: historiaId,
        TipoEstudio: tipoEstudio.value,
        Descripcion: descripcionEstudio.value.trim(),
        ...(enlace ? { Enlace: enlace } : {}),
      }),
    })
    if (!response.ok) throw new Error(await leerError(response))
    descripcionEstudio.value = ''
    enlaceEstudio.value = ''
    await cargarEstudios(historiaId)
  } catch (error) {
    mostrarError(error)
  }
}

const agregarEvolucion = async () => {
  if (!historia.value || !evolucionValida.value) return
  const pacienteId = historia.value.PacienteId
  try {
    const response = await fetch(`${API}/evolucion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        HistoriaClinicaId: historia.value.Id,
        MedicoId: medicoId.value,
        Observaciones: observaciones.value.trim(),
      }),
    })
    if (!response.ok) throw new Error(await leerError(response))
    observaciones.value = ''
    await cargarHistoria(pacienteId)
  } catch (error) {
    mostrarError(error)
  }
}
</script>

<style scoped>
.hospital-container {
  --med-blue: #0284c7;
  --med-blue-hover: #0369a1;
  --card-bg: #ffffff;
  --text-main: #334155;
  --text-muted: #64748b;
  --border-color: #e2e8f0;

  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text-main);
}

.header {
  margin-bottom: 2rem;
  border-left: 5px solid var(--med-blue);
  padding-left: 1rem;
}

.header h2 {
  margin: 0;
  font-size: 1.8rem;
  color: var(--med-blue);
}

.subtitle {
  margin: 0.2rem 0 0 0;
  color: var(--text-muted);
}

.card {
  background: var(--card-bg);
  border-radius: 10px;
  box-shadow:
    0 4px 6px -1px rgba(0, 0, 0, 0.05),
    0 2px 4px -2px rgba(0, 0, 0, 0.05);
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--border-color);
}

.section-title {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  color: var(--med-blue);
}

.search-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.label,
.field-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
  margin: 0.75rem 0 0.25rem 0;
}

.search-row .label {
  margin: 0;
}

.input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--text-main);
}

.search-row .input,
.input-corto {
  width: 140px;
}

.input-medio {
  width: 240px;
}

.lista-estudios {
  margin-top: 1.5rem;
}

.evolucion a {
  display: inline-block;
  margin-top: 0.5rem;
  color: var(--med-blue);
  font-weight: 600;
}

.textarea {
  resize: vertical;
  margin-bottom: 1rem;
}

.input:focus {
  outline: 2px solid var(--med-blue);
  border-color: transparent;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.search-row .btn {
  margin-top: 0;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background-color: var(--med-blue);
  color: white;
}
.btn-primary:hover:not(:disabled) {
  background-color: var(--med-blue-hover);
}

.btn-success {
  background-color: #10b981;
  color: white;
}
.btn-success:hover:not(:disabled) {
  background-color: #059669;
}

.aviso {
  margin: 1rem 0 0.5rem 0;
  color: var(--text-muted);
}

.nota {
  margin: 0 0 0.5rem 0;
  font-size: 0.85rem;
  color: var(--text-muted);
  font-style: italic;
}

.ficha-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.field-value {
  font-weight: 600;
}

.evolucion {
  border-left: 3px solid var(--med-blue);
  background-color: #f8fafc;
  padding: 0.75rem 1rem;
  border-radius: 0 6px 6px 0;
  margin-bottom: 0.75rem;
}

.evolucion-head {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.evolucion-texto {
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
}

.badge-id {
  background-color: #e2e8f0;
  color: var(--text-muted);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.empty-state {
  text-align: center;
  padding: 1rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>
