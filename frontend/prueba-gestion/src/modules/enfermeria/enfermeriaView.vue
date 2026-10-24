<script setup lang="ts">
import { ref, onMounted } from 'vue';

// 1. Definición de tipos acorde al módulo de enfermería
interface SignosVitales {
  id: number;
  pacienteId: number;
  temperatura: number;
  presionArterial: string;
  pulso: number;
  saturacionOxigeno: number;
  fechaRegistro: string;
}

// Estados reactivos
const registros = ref<SignosVitales[]>([]);
const cargando = ref(false);
const errorMensaje = ref('');

// URL base del backend
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// 2. Llamada GET directa para obtener los signos vitales
const obtenerSignosVitales = async () => {
  cargando.value = true;
  errorMensaje.value = '';

  try {
    const response = await fetch(`${API_URL}/enfermeria/signos-vitales`);

    if (!response.ok) {
      throw new Error(`Error al obtener los registros (${response.status})`);
    }

    registros.value = await response.json();
  } catch (error: any) {
    errorMensaje.value = error.message || 'Ocurrió un error inesperado';
    console.error(error);
  } finally {
    cargando.value = false;
  }
};

// 3. Llamada POST directa para registrar nuevos signos vitales o una administración
const registrarSignos = async (nuevoRegistro: Omit<SignosVitales, 'id' | 'fechaRegistro'>) => {
  try {
    const response = await fetch(`${API_URL}/enfermeria/signos-vitales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(nuevoRegistro),
    });

    if (!response.ok) {
      throw new Error('No se pudo guardar el registro de enfermería');
    }

    const data = await response.json();
    registros.value.unshift(data); // Añadimos el nuevo registro al inicio de la lista
  } catch (error: any) {
    console.error(error);
    alert(error.message);
  }
};

onMounted(() => {
  obtenerSignosVitales();
});
</script>

<template>
  <div class="enfermeria-view">
    <h2>Módulo de Enfermería - Control de Signos Vitales</h2>

    <p v-if="cargando">Cargando registros...</p>
    <p v-if="errorMensaje" class="error">{{ errorMensaje }}</p>

    <div v-if="!cargando && registros.length > 0">
      <table>
        <thead>
          <tr>
            <th>ID Paciente</th>
            <th>Temperatura</th>
            <th>Presión Arterial</th>
            <th>Pulso</th>
            <th>SpO2</th>
            <th>Fecha / Hora</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reg in registros" :key="reg.id">
            <td>{{ reg.pacienteId }}</td>
            <td>{{ reg.temperatura }} °C</td>
            <td>{{ reg.presionArterial }}</td>
            <td>{{ reg.pulso }} lpm</td>
            <td>{{ reg.saturacionOxigeno }}%</td>
            <td>{{ reg.fechaRegistro }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else-if="!cargando">No hay registros de signos vitales cargados.</p>
  </div>
</template>

<style scoped>
.error {
  color: red;
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}
th, td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: left;
}
</style>