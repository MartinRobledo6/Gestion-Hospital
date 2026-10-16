<template>
  <div class="hospital-container">
    <header class="header">
      <h2>Gestión de Camas</h2>
      <p class="subtitle">Monitoreo y asignación de camas hospitalarias</p>
    </header>

    <div class="card table-card">
      <table class="hospital-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Número de Cama</th>
            <th>Estado</th>
            <th>Versión</th>
            <th class="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cama in camas" :key="cama.Id">
            <td>
              <span class="badge-id">#{{ cama.Id }}</span>
            </td>
            <td class="fw-bold">{{ cama.Numero }}</td>
            <td>
              <span :class="['status-badge', getStatusClass(cama.Estado)]">
                {{ cama.Estado.toUpperCase() }}
              </span>
            </td>
            <td>v{{ cama.Version }}</td>
            <td class="text-center">
              <button
                v-if="cama.Estado.toLowerCase() === 'libres'"
                @click="asignar(cama.Numero)"
                class="btn btn-primary"
              >
                Asignar
              </button>

              <button
                v-if="cama.Estado.toLowerCase() === 'ocupadas'"
                @click="liberar(cama.Numero)"
                class="btn btn-success"
              >
                Dar de Alta
              </button>

              <button
                v-if="
                  cama.Estado.toLowerCase() === 'en limpieza' ||
                  cama.Estado.toLowerCase() === 'en_limpieza'
                "
                @click="limpiar(cama.Numero)"
                class="btn btn-warning"
              >
                Finalizar Limpieza
              </button>

              <button
                v-if="cama.Estado.toLowerCase() === 'bloqueadas'"
                @click="desbloquear(cama.Numero)"
                class="btn btn-success"
              >
                Desbloquear (Operativa)
              </button>

              <button
                v-if="cama.Estado.toLowerCase() === 'libres'"
                @click="procesarAccion('bloquear', cama.Numero)"
                class="btn btn-danger"
                style="margin-left: 5px"
              >
                Bloquear
              </button>
            </td>
          </tr>

          <tr v-if="camas.length === 0">
            <td colspan="5" class="empty-state">No hay camas registradas en el sistema.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Cama {
  Id: number
  Numero: string
  Estado: string
  Version: number
}

const camas = ref<Cama[]>([])

// Función auxiliar para asignar el color correcto a la píldora de estado
const getStatusClass = (estado: string) => {
  const est = estado.toLowerCase()
  if (est === 'libres') return 'status-ok'
  if (est === 'ocupadas') return 'status-busy'
  if (est === 'en limpieza' || est === 'en_limpieza') return 'status-warning'
  if (est === 'bloqueadas') return 'status-locked'
  return ''
}

const fetchCamas = async () => {
  try {
    const response = await fetch('http://localhost:3000/camas/listado')
    if (!response.ok) throw new Error('Error al obtener las camas')
    camas.value = await response.json()
  } catch (error) {
    console.error('Error de conexion:', error)
  }
}

const procesarAccion = async (endpoint: string, numero: string, extraData = {}) => {
  try {
    const response = await fetch(`http://localhost:3000/camas/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numero, ...extraData }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.message || 'Error desconocido en el servidor')
    }
    await fetchCamas()
  } catch (error) {
    if (error instanceof Error) {
      alert(`No se pudo completar la acción:\n${error.message}`)
    } else {
      alert('Ocurrió un error desconocido al procesar la acción.')
    }
    console.error('Detalle del error:', error)
  }
}

// Ojo acá: El pacienteId 1 asume que ya creaste el paciente Ignacio Mullasano
const asignar = (numero: string) => procesarAccion('asignar', numero, { pacienteId: 1 })
const liberar = (numero: string) => procesarAccion('liberar', numero)
const limpiar = (numero: string) => procesarAccion('limpiar', numero)
const desbloquear = (numero: string) => procesarAccion('desbloquear', numero)

onMounted(() => {
  fetchCamas()
})
</script>

<style scoped>
/* Variables y contenedor principal */
.hospital-container {
  --med-blue: #0284c7;
  --med-blue-hover: #0369a1;
  --card-bg: #ffffff;
  --text-main: #334155;
  --text-muted: #64748b;
  --border-color: #e2e8f0;

  /* Colores para las píldoras de estado */
  --success-bg: #dcfce7;
  --success-text: #166534;
  --busy-bg: #fee2e2;
  --busy-text: #991b1b;
  --warning-bg: #fef9c3;
  --warning-text: #854d0e;
  --locked-bg: #f1f5f9;
  --locked-text: #475569;

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

/* Tarjetas (Cards) */
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

/* Tabla Clínica */
.table-card {
  padding: 0;
  overflow: hidden;
}

.hospital-table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

.hospital-table th {
  background-color: #f1f5f9;
  color: var(--text-muted);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  padding: 1rem;
  border-bottom: 2px solid var(--border-color);
}

.hospital-table td {
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
  vertical-align: middle;
}

.hospital-table tr:last-child td {
  border-bottom: none;
}

.hospital-table tr:hover {
  background-color: #f8fafc;
}

.fw-bold {
  font-weight: 600;
  color: var(--text-main);
}

.text-center {
  text-align: center;
}

/* Botones con colores específicos por acción */
.btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: var(--med-blue);
  color: white;
}
.btn-primary:hover {
  background-color: var(--med-blue-hover);
}

.btn-success {
  background-color: #10b981;
  color: white;
}
.btn-success:hover {
  background-color: #059669;
}

.btn-warning {
  background-color: #f59e0b;
  color: white;
}
.btn-warning:hover {
  background-color: #d97706;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}
.btn-danger:hover {
  background-color: #dc2626;
}

/* Badges e Indicadores visuales */
.badge-id {
  background-color: #e2e8f0;
  color: var(--text-muted);
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
}

.status-badge {
  padding: 0.3rem 0.6rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.status-ok {
  background-color: var(--success-bg);
  color: var(--success-text);
}
.status-busy {
  background-color: var(--busy-bg);
  color: var(--busy-text);
}
.status-warning {
  background-color: var(--warning-bg);
  color: var(--warning-text);
}
.status-locked {
  background-color: var(--locked-bg);
  color: var(--locked-text);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>
