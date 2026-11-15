<script setup lang="ts">
import { ref, watch } from 'vue'
import { apiFetch } from '../api'
import { API_URL } from '../config'

import { pacienteVacio, type CoberturaOpcion, type DatosPaciente } from './datosPaciente'

const props = defineProps<{
  coberturas: CoberturaOpcion[]
  // Solo para el personal: busca al paciente por DNI y completa sus datos
  buscarPorDni?: boolean
}>()

const datos = defineModel<DatosPaciente>({ required: true })

// null: todavía no se buscó · 'existente': ya registrado (datos bloqueados) · 'nuevo'
const estado = ref<'buscando' | 'existente' | 'nuevo' | null>(null)
const hoy = new Date().toISOString().slice(0, 10)

const buscar = async () => {
  const dni = datos.value.documento.trim()
  if (!props.buscarPorDni || !/^\d{6,10}$/.test(dni)) return

  estado.value = 'buscando'
  try {
    const res = await apiFetch(
      `${API_URL}/admision/pacientes/buscar?${new URLSearchParams({ documento: dni })}`,
    )
    if (res.ok) {
      const p = await res.json()
      datos.value = {
        documento: p.documento,
        nombre: p.nombre,
        apellido: p.apellido,
        fechaNacimiento: String(p.fechaNacimiento).slice(0, 10),
        coberturaId: p.coberturaId,
      }
      estado.value = 'existente'
    } else {
      estado.value = 'nuevo'
    }
  } catch {
    estado.value = null // sin conexión: se deja cargar a mano
  }
}

// Si cambian el DNI de un paciente ya encontrado, se limpian sus datos
const alCambiarDni = () => {
  if (estado.value === 'existente') {
    datos.value = { ...pacienteVacio(), documento: datos.value.documento }
  }
  estado.value = null
}

const bloqueado = () => estado.value === 'existente'

// Cuando el padre limpia el formulario (DNI vacío), se vuelve al estado inicial
watch(
  () => datos.value.documento,
  (dni) => {
    if (!dni) estado.value = null
  },
)
</script>

<template>
  <div class="datos-paciente">
    <div class="fila">
      <label>
        DNI del paciente
        <input
          v-model="datos.documento"
          type="text"
          inputmode="numeric"
          pattern="\d{6,10}"
          title="Entre 6 y 10 números, sin puntos"
          placeholder="Ej: 30111222"
          maxlength="10"
          autocomplete="off"
          required
          @input="alCambiarDni"
          @blur="buscar"
        />
      </label>

      <label>
        Nombre
        <input
          v-model="datos.nombre"
          type="text"
          placeholder="Ej: Juan"
          minlength="2"
          maxlength="100"
          autocomplete="off"
          :readonly="bloqueado()"
          required
        />
      </label>

      <label>
        Apellido
        <input
          v-model="datos.apellido"
          type="text"
          placeholder="Ej: Pérez"
          minlength="2"
          maxlength="100"
          autocomplete="off"
          :readonly="bloqueado()"
          required
        />
      </label>
    </div>

    <div class="fila">
      <label>
        Fecha de nacimiento
        <input
          v-model="datos.fechaNacimiento"
          type="date"
          :max="hoy"
          :readonly="bloqueado()"
          required
        />
      </label>

      <label>
        Cobertura
        <select v-model="datos.coberturaId" :disabled="bloqueado()">
          <option :value="null">Particular (sin cobertura)</option>
          <option v-for="c in coberturas" :key="c.id" :value="c.id">
            {{ c.nombre }}
          </option>
        </select>
      </label>
    </div>

    <p v-if="estado === 'buscando'" class="estado">Buscando paciente…</p>
    <p v-else-if="estado === 'existente'" class="estado ok">
      Paciente ya registrado: se usan sus datos.
    </p>
    <p v-else-if="estado === 'nuevo'" class="estado">
      No hay un paciente con ese DNI: se va a registrar con estos datos.
    </p>
  </div>
</template>

<style scoped>
/* Mismo aspecto que los formularios de Admisión (las variables vienen de .vista) */
.datos-paciente {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

input[readonly],
select:disabled {
  background: #f8fafc;
  color: var(--suave, #64748b);
}

input::placeholder {
  color: #94a3b8;
}

select:focus-visible,
input:focus-visible {
  outline: 2px solid var(--azul, #0a7bc4);
  outline-offset: 2px;
}

.estado {
  margin: 0;
  font-size: 0.85rem;
  color: var(--suave, #64748b);
}

.estado.ok {
  color: #15803d;
}
</style>
