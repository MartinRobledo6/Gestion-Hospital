<script setup lang="ts">
import { ref, computed } from 'vue';
import { apiFetch } from '../api';
import { useAuthStore } from '../stores/auth';
import { accionesPara } from '../permisos';
import { usePolling } from '../composable/usepolling';

// ---------- Tipos ----------
interface Turno {
  id: number;
  pacienteNombre: string | null;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  esEntreturno: boolean;
  duracionReducida: boolean;
}

interface Horario {
  id: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionIntervaloMinutos: number;
}

interface Agenda {
  profesional: { id: number; nombre: string; tipo: string; especialidad: string };
  horarios: Horario[];
  turnos: Turno[];
}

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

type Filtro = 'dia' | 'proximos' | 'todos';

const API_URL = 'http://localhost:3000/admision';
const INTERVALO_MS = 15_000;
const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const auth = useAuthStore();

// ---------- Estado ----------
const agenda = ref<Agenda | null>(null);
const cargando = ref(false);
const error = ref<string | null>(null);
const aviso = ref<Aviso | null>(null);
const llegadas = ref<string[]>([]); // pacientes que llegaron desde la última vez que miraste

const hoy = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
const filtro = ref<Filtro>('dia');
const fecha = ref<string>(hoy());

// ---------- Formato ----------
const formatearFecha = (iso: string) => new Date(iso).toLocaleString('es-AR');
const hhmm = (h: string) => h.slice(0, 5);
const claseEstado = (estado: string) => estado.toLowerCase().replace(/ /g, '-');
const minutosTurno = (t: Turno) =>
  Math.round((new Date(t.fechaHoraFin).getTime() - new Date(t.fechaHoraInicio).getTime()) / 60000);

// Solo las acciones del médico: "Atendido" cuando el turno está En Sala de Espera
const acciones = (estado: string) => accionesPara(auth.rol, estado);

// ---------- Datos derivados ----------
const turnosFiltrados = computed(() => {
  const lista = agenda.value?.turnos ?? [];
  if (filtro.value === 'dia') {
    return lista.filter(
      (t) => new Date(t.fechaHoraInicio).toLocaleDateString('en-CA') === fecha.value,
    );
  }
  if (filtro.value === 'proximos') {
    const ahora = Date.now();
    return lista.filter(
      (t) =>
        new Date(t.fechaHoraFin).getTime() >= ahora &&
        t.estado !== 'Cancelado' &&
        t.estado !== 'Atendido',
    );
  }
  return lista;
});

// Pacientes que ya llegaron y esperan ser atendidos
const enEspera = computed(
  () => (agenda.value?.turnos ?? []).filter((t) => t.estado === 'En Sala de Espera').length,
);

// ---------- Notificación de llegada (HU 2.1) ----------
// Se compara qué turnos estaban "En Sala de Espera" en la consulta anterior
// contra la actual: los que aparecen nuevos son pacientes que recién llegaron.
let idsEnSalaAnterior: Set<number> | null = null; // null = primera carga, no avisar

const detectarLlegadas = (turnos: Turno[]) => {
  const enSala = turnos.filter((t) => t.estado === 'En Sala de Espera');
  if (idsEnSalaAnterior) {
    const anteriores = idsEnSalaAnterior;
    const nuevos = enSala.filter((t) => !anteriores.has(t.id));
    if (nuevos.length) {
      llegadas.value = [...nuevos.map((t) => t.pacienteNombre ?? 'Paciente'), ...llegadas.value];
    }
  }
  idsEnSalaAnterior = new Set(enSala.map((t) => t.id));
};

// ---------- Mensajes ----------
const leerError = async (res: Response, porDefecto: string) => {
  try {
    const data = await res.json();
    return Array.isArray(data.message) ? data.message.join(', ') : data.message || porDefecto;
  } catch {
    return porDefecto;
  }
};

// ---------- Llamadas al backend ----------
// silencioso = true en el refresco automático, para que el botón no parpadee
const obtenerAgenda = async (silencioso = false) => {
  if (!silencioso) cargando.value = true;
  try {
    const res = await apiFetch(`${API_URL}/mi-agenda`);
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo obtener tu agenda.'));
    const data: Agenda = await res.json();
    detectarLlegadas(data.turnos);
    agenda.value = data;
    error.value = null;
  } catch (err: any) {
    error.value = err.message;
  } finally {
    cargando.value = false;
  }
};

const cambiarEstado = async (turno: Turno, nuevoEstado: string) => {
  aviso.value = null;
  try {
    const res = await apiFetch(`${API_URL}/turnos/${turno.id}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado }),
    });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo cambiar el estado.'));
    aviso.value = {
      tipo: 'ok',
      texto: `Turno de ${turno.pacienteNombre ?? 'paciente'} marcado como "${nuevoEstado}".`,
    };
    await obtenerAgenda();
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message };
  }
};

// Primera carga con indicador; las siguientes, silenciosas
usePolling(() => obtenerAgenda(agenda.value !== null), INTERVALO_MS);
</script>


<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Mi agenda</h1>
        <p v-if="agenda" class="subtitulo">
          {{ agenda.profesional.nombre }} · {{ agenda.profesional.especialidad }}
        </p>
      </div>
      <button class="btn btn-secundario" :disabled="cargando" @click="obtenerAgenda()">
        {{ cargando ? 'Actualizando…' : 'Actualizar' }}
      </button>
    </header>

    <p v-if="error" class="aviso error" role="alert">{{ error }}</p>
    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">{{ aviso.texto }}</p>

    <!-- Aviso de llegada: un paciente pasó a "En Sala de Espera" (HU 2.1) -->
    <div v-if="llegadas.length" class="alerta-llegada" role="alert">
      <span>
        🔔 <strong>{{ llegadas.join(', ') }}</strong>
        {{ llegadas.length === 1 ? 'llegó y está' : 'llegaron y están' }} en sala de espera.
      </span>
      <button class="btn btn-secundario" @click="llegadas = []">Entendido</button>
    </div>

    <template v-if="agenda">
      <!-- Turnos -->
      <section class="tarjeta">
        <h2>
          Mis turnos
          <span v-if="enEspera" class="badge en-sala-de-espera">{{ enEspera }} esperando atención</span>
        </h2>

        <div class="fila">
          <label>
            Mostrar
            <select v-model="filtro">
              <option value="dia">Un día</option>
              <option value="proximos">Próximos pendientes</option>
              <option value="todos">Todos</option>
            </select>
          </label>
          <label v-if="filtro === 'dia'">
            Fecha
            <input v-model="fecha" type="date" />
          </label>
        </div>

        <p v-if="!turnosFiltrados.length" class="nota">No hay turnos para mostrar.</p>

        <div v-else class="tabla-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th>Paciente</th>
                <th>Fecha y hora</th>
                <th>Estado</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in turnosFiltrados" :key="t.id">
                <td class="fuerte">{{ t.pacienteNombre ?? 'Sin asignar' }}</td>
                <td>
                  {{ formatearFecha(t.fechaHoraInicio) }}
                  <span class="nota">· {{ minutosTurno(t) }} min</span>
                </td>
                <td>
                  <span :class="['badge', claseEstado(t.estado)]">{{ t.estado }}</span>
                  <span v-if="t.esEntreturno" class="badge entreturno">Entreturno</span>
                  <span
                    v-if="t.duracionReducida"
                    class="badge reducido"
                    title="Este turno fue acortado por un entreturno"
                  >
                    Tiempo reducido
                  </span>
                </td>
                <td class="acciones">
                  <button
                    v-for="siguiente in acciones(t.estado)"
                    :key="siguiente"
                    class="btn btn-accion"
                    @click="cambiarEstado(t, siguiente)"
                  >
                    Marcar {{ siguiente.toLowerCase() }}
                  </button>
                  <span v-if="!acciones(t.estado).length" class="nota">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- Horarios (solo lectura: los carga recepción o el admin) -->
      <section class="tarjeta">
        <h2>Mis horarios de atención</h2>
        <p v-if="!agenda.horarios.length" class="nota">
          Todavía no tenés horarios cargados. Los carga la recepción.
        </p>
        <div v-else class="tabla-wrap">
          <table class="tabla">
            <thead>
              <tr>
                <th>Día</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Intervalo</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="h in agenda.horarios" :key="h.id">
                <td class="fuerte">{{ DIAS[h.diaSemana] }}</td>
                <td>{{ hhmm(h.horaInicio) }}</td>
                <td>{{ hhmm(h.horaFin) }}</td>
                <td>{{ h.duracionIntervaloMinutos }} min</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.vista {
  --azul: #0a7bc4;
  --azul-oscuro: #0866a2;
  --azul-claro: #eaf4fb;
  --texto: #1e293b;
  --suave: #64748b;
  --borde: #e2e8f0;

  max-width: 920px;
  margin: 0 auto;
  padding: 40px 16px 64px;
  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

/* Encabezado de página */
.encabezado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
}

.encabezado > div {
  padding-left: 16px;
  border-left: 4px solid var(--azul);
}

h1 {
  margin: 0;
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--azul);
}

.subtitulo {
  margin: 2px 0 0;
  color: var(--suave);
}

/* Tarjetas */
.tarjeta {
  background: #fff;
  border: 1px solid var(--borde);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.06);
  padding: 24px;
  margin-bottom: 24px;
}

h2 {
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--borde);
  font-size: 1.05rem;
  font-weight: 700;
}

/* Formularios */
.form-reserva {
  display: flex;
  flex-direction: column;
  gap: 20px;
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
  color: var(--suave);
}

select,
input {
  padding: 10px 12px;
  border: 1px solid var(--borde);
  border-radius: 6px;
  font: inherit;
  font-weight: 400;
  color: var(--texto);
  background: #fff;
}

input::placeholder {
  color: #94a3b8;
}

select:focus-visible,
input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--azul);
  outline-offset: 2px;
}

/* Horarios */
.horarios-campo {
  margin: 0;
  padding: 0;
  border: 0;
}

.horarios-campo legend {
  padding: 0;
  margin-bottom: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--suave);
}

.contador {
  display: inline-block;
  margin-left: 6px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 0.75rem;
  font-weight: 700;
}

.horarios {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
  gap: 8px;
}

.horario {
  padding: 9px 0;
  border: 1px solid var(--borde);
  background: #fff;
  color: var(--texto);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

.horario:hover {
  border-color: var(--azul);
  background: var(--azul-claro);
}

.horario.elegido {
  border-color: var(--azul);
  background: var(--azul);
  color: #fff;
}

.resumen {
  margin: 0;
  font-weight: 700;
  color: var(--azul);
  text-transform: capitalize;
}

/* Botones */
button {
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  padding: 9px 18px;
  border: 1px solid transparent;
  font-size: 0.85rem;
  font-weight: 600;
}

.btn-primario {
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
}

.btn-primario:hover:not(:disabled) {
  background: var(--azul-oscuro);
}

.btn-secundario {
  background: #fff;
  border-color: var(--borde);
  color: var(--texto);
}

.btn-secundario:hover:not(:disabled) {
  background: #f1f5f9;
}

/* Avisos */
.aviso {
  margin: 0 0 24px;
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

/* Aviso de llegada de paciente */
.alerta-llegada {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 0 0 24px;
  padding: 12px 16px;
  border: 1px solid #fcd34d;
  border-radius: 8px;
  background: #fef3c7;
  color: #92400e;
}

.nota {
  margin: 0;
  font-size: 0.9rem;
  color: var(--suave);
}

/* Tabla */
.tabla-wrap {
  overflow-x: auto;
  border: 1px solid var(--borde);
  border-radius: 8px;
}

.tabla {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.tabla th {
  padding: 14px 16px;
  background: #f1f5f9;
  border-bottom: 1px solid var(--borde);
  text-align: left;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: #475569;
  white-space: nowrap;
}

.tabla td {
  padding: 14px 16px;
  border-bottom: 1px solid var(--borde);
  white-space: nowrap;
}

.tabla tbody tr:last-child td {
  border-bottom: 0;
}

.fuerte {
  font-weight: 700;
}

.id-chip {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 4px;
  background: #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  font-weight: 700;
}

/* Estados */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

.programado {
  background: #dbeafe;
  color: #1e40af;
}
.confirmado {
  background: #dcfce7;
  color: #166534;
}
.en-sala-de-espera {
  background: #fef3c7;
  color: #92400e;
}
.atendido {
  background: #e2e8f0;
  color: #475569;
}
.cancelado {
  background: #fee2e2;
  color: #991b1b;
}

/* Etiquetas de entreturno */
.entreturno {
  margin-left: 6px;
  background: #ede9fe;
  color: #5b21b6;
}
.reducido {
  margin-left: 6px;
  background: #ffedd5;
  color: #9a3412;
}

/* Acciones */
.acciones {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.btn-accion {
  padding: 5px 12px;
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
  font-size: 0.8rem;
}

.btn-accion:hover {
  background: var(--azul-oscuro);
}

.btn-accion.peligro {
  background: #ef4444;
  border-color: #ef4444;
}

.btn-accion.peligro:hover {
  background: #dc2626;
}

@media (max-width: 600px) {
  select,
  input {
    width: 100%;
  }

  .encabezado {
    flex-direction: column;
    align-items: stretch;
  }

  .fila-final {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>