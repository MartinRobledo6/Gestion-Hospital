<template>
  <div class="facturacion-container">
    <div class="header-title">
      <h2>Módulo de Facturación y Finanzas</h2>
    </div>
    <div class="card">
      <h3 class="card-title">Nueva Simulación de Cobro</h3>

      <div class="form-row">
        <div class="form-group">
          <label>ID Cuenta de Estadía</label>
          <input v-model="cuentaId" type="number" placeholder="Ej: 1" />
        </div>

        <div class="form-group">
          <label>Tipo de Cobertura</label>
          <select v-model="cobertura">
            <option value="Pública">Pública</option>
            <option value="Prepaga">Prepaga</option>
            <option value="Particular">Particular</option>
          </select>
        </div>

        <div class="form-group button-group">
          <button @click="generarCargoPrueba" class="btn-primary">
            Simular Cobro ($15.000)
          </button>
        </div>
      </div>
    </div>

    <div v-if="mensaje" class="card result-card">
      <div class="result-content">
        <span class="badge" :class="exito ? 'badge-success' : 'badge-error'">
          {{ exito ? "ÉXITO" : "ERROR" }}
        </span>
        <p class="result-text">{{ mensaje }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

const cuentaId = ref(1);
const cobertura = ref("Prepaga");
const mensaje = ref("");
const exito = ref(true);

const generarCargoPrueba = async () => {
  try {
    const response = await fetch(
      `http://localhost:3000/facturacion/cuentas/${cuentaId.value}/cargos`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          costoBase: 15000,
          concepto: "Consulta Médica General",
          tipoCobertura: cobertura.value,
        }),
      },
    );

    if (!response.ok) throw new Error("Error en el servidor");

    const data = await response.json();
    exito.value = true;
    mensaje.value = `Liquidación procesada. Paciente abona: $${data.TotalCargoPaciente} | Terceros (Estado/OS) abonan: $${data.TotalCargoTerceros}.`;
  } catch (error) {
    exito.value = false;
    mensaje.value =
      "Falló la conexión. Verificá que el backend de NestJS esté encendido.";
  }
};
</script>

<style scoped>
.header-title {
  margin-bottom: 30px;
  border-left: 4px solid #0077b6;
  padding-left: 15px;
  text-align: left;
}
.header-title h2 {
  margin: 0;
  color: #0077b6;
  font-size: 1.5rem;
  font-weight: 600;
}
.header-title p {
  margin: 5px 0 0 0;
  color: #8a939b;
  font-size: 0.9rem;
}

.card {
  background: white;
  border: 1px solid #eef0f2;
  border-radius: 8px;
  padding: 25px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
  margin-bottom: 20px;
  text-align: left;
}
.card-title {
  margin: 0 0 20px 0;
  font-size: 1.1rem;
  color: #2c3e50;
  font-weight: 600;
  text-align: left;
}

.form-row {
  display: flex;
  gap: 20px;
  align-items: flex-end;
  flex-wrap: wrap;
}
.form-group {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  text-align: left;
}
.form-group label {
  font-size: 0.8rem;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}

.form-group input,
.form-group select {
  background-color: #ffffff;
  color: #2c3e50;
  padding: 12px 15px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: all 0.2s;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.02);
}
.form-group input:focus,
.form-group select:focus {
  border-color: #0077b6;
  box-shadow: 0 0 0 3px rgba(0, 119, 182, 0.15);
}

.button-group {
  flex: 0.5;
}
.btn-primary {
  background-color: #0077b6;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
  width: 100%;
  box-shadow: 0 2px 4px rgba(0, 119, 182, 0.2);
}
.btn-primary:hover {
  background-color: #005f92;
}

.result-card {
  background-color: #f8f9fa;
  border-left: 4px solid #eef0f2;
  margin-top: 20px;
}
.result-content {
  display: flex;
  align-items: center;
  gap: 15px;
}
.badge {
  padding: 5px 10px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  color: white;
}
.badge-success {
  background-color: #10b981;
}
.badge-error {
  background-color: #ef4444;
}
.result-text {
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 500;
}
</style>
