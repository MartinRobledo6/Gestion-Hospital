<template>
  <div class="hospital-container">
    <header class="header">
      <h2>Gestión de Inventario e Insumos</h2>
      <p class="subtitle">Módulo de farmacia y recursos</p>
    </header>

    <!-- Tarjeta del Formulario -->
    <div class="card form-card">
      <h3>Nuevo Insumo</h3>
      <form @submit.prevent="crearInsumo" class="grid-form">
        <div class="input-group">
          <label>Nombre del Insumo</label>
          <input v-model="nuevoInsumo.Nombre" placeholder="Ej: Ibuprofeno 400mg" required />
        </div>
        <div class="input-group">
          <label>Stock Inicial</label>
          <input
            v-model.number="nuevoInsumo.StockActual"
            type="number"
            placeholder="0"
            required
            min="0"
          />
        </div>
        <div class="input-group">
          <label>Precio Unitario (\$)</label>
          <input
            v-model.number="nuevoInsumo.PrecioUnitario"
            type="number"
            step="0.01"
            placeholder="0.00"
            required
            min="0"
          />
        </div>
        <div class="button-group">
          <button type="submit" class="btn btn-primary">Registrar Insumo</button>
        </div>
      </form>
    </div>

    <div class="card table-card">
      <table class="hospital-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Descripción del Insumo</th>
            <th>Stock Actual</th>
            <th>Precio Unitario</th>
            <th class="text-center">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="insumo in insumos" :key="insumo.Id">
            <td>
              <span class="badge-id">#{{ insumo.Id }}</span>
            </td>
            <td class="fw-bold">{{ insumo.Nombre }}</td>
            <td>
              <span
                :class="['status-badge', insumo.StockActual > 10 ? 'status-ok' : 'status-warning']"
              >
                {{ insumo.StockActual }} u.
              </span>
            </td>
            <td>\$ {{ insumo.PrecioUnitario }}</td>
            <td class="text-center">
              <button @click="eliminarInsumo(insumo.Id)" class="btn btn-danger">Eliminar</button>
            </td>
          </tr>
          <tr v-if="insumos.length === 0">
            <td colspan="5" class="empty-state">No hay insumos registrados en el inventario.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

interface Insumo {
  Id: number
  Nombre: string
  StockActual: number
  PrecioUnitario: number
}

const insumos = ref<Insumo[]>([])
const nuevoInsumo = ref({
  Nombre: '',
  StockActual: 0,
  PrecioUnitario: 0,
})

const fetchInsumos = async () => {
  try {
    const response = await fetch('http://localhost:3000/inventario')
    if (!response.ok) throw new Error('Error al obtener el inventario')
    insumos.value = await response.json()
  } catch (error) {
    console.error('Error de conexión:', error)
  }
}

const crearInsumo = async () => {
  try {
    const response = await fetch('http://localhost:3000/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevoInsumo.value),
    })

    if (!response.ok) throw new Error('No se pudo crear el insumo')

    nuevoInsumo.value = { Nombre: '', StockActual: 0, PrecioUnitario: 0 }
    await fetchInsumos()
  } catch (error) {
    console.error('Error al crear:', error)
    alert('Ocurrió un error al registrar el insumo.')
  }
}

const eliminarInsumo = async (id: number) => {
  if (!confirm('¿Estás seguro de eliminar este insumo del sistema?')) return
  try {
    const response = await fetch(`http://localhost:3000/inventario/${id}`, {
      method: 'DELETE',
    })
    if (!response.ok) throw new Error('No se pudo eliminar')
    await fetchInsumos()
  } catch (error) {
    console.error('Error al eliminar:', error)
  }
}

onMounted(() => {
  fetchInsumos()
})
</script>

<style scoped>
.hospital-container {
  --med-blue: #0284c7;
  --med-blue-hover: #0369a1;
  --bg-color: #f8fafc;
  --card-bg: #ffffff;
  --text-main: #334155;
  --text-muted: #64748b;
  --border-color: #e2e8f0;
  --danger: #ef4444;
  --danger-hover: #dc2626;
  --success-bg: #dcfce7;
  --success-text: #166534;
  --warning-bg: #fef9c3;
  --warning-text: #854d0e;

  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
  font-family: 'Segoe UI', system-ui, sans-serif;
  color: var(--text-main);
  background-color: var(--bg-color);
  min-height: 100vh;
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

.card h3 {
  margin-top: 0;
  margin-bottom: 1.5rem;
  font-size: 1.2rem;
  color: var(--text-main);
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 0.5rem;
}

/* Formulario Moderno */
.grid-form {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.input-group label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-muted);
}

input {
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-size: 0.95rem;
  transition: border-color 0.2s;
}

input:focus {
  outline: none;
  border-color: var(--med-blue);
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.1);
}

.btn {
  padding: 0.6rem 1.2rem;
  border: none;
  border-radius: 6px;
  font-weight: 600;
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

.btn-danger {
  background-color: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  padding: 0.4rem 0.8rem;
  font-size: 0.85rem;
}

.btn-danger:hover {
  background-color: var(--danger);
  color: white;
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
  font-size: 0.85rem;
  font-weight: 600;
}

.status-ok {
  background-color: var(--success-bg);
  color: var(--success-text);
}

.status-warning {
  background-color: var(--warning-bg);
  color: var(--warning-text);
}

.empty-state {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  font-style: italic;
}
</style>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100vh;
  background-color: #f8fafc;
}
</style>
