<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

// ---------- Tipos ----------
type TipoProfesional = 'medico' | 'enfermero';

interface Turno {
  id: number;
  pacienteId: number | null;
  pacienteNombre: string | null;
  medicoId: number;
  fechaHoraInicio: string;
  fechaHoraFin: string;
  estado: string;
  esEntreturno: boolean;
  duracionReducida: boolean;
}

interface Bloque {
  inicio: string;
  fin: string;
}

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

interface Medico {
  id: number;
  nombre: string;
  tipo: TipoProfesional;
  especialidad: string;
}

const API_URL = 'http://localhost:3000/admision';

const turnos = ref<Turno[]>([]);
const cargando = ref(false);
const cargandoHorarios = ref(false);
const reservando = ref(false);
const error = ref<string | null>(null);
const aviso = ref<Aviso | null>(null);

// Fecha local de hoy en formato YYYY-MM-DD
const hoy = () => {
  const f = new Date();
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  const dia = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${mes}-${dia}`;
};

// Selección para reservar: profesional -> fecha -> horario -> datos del paciente
const medicos = ref<Medico[]>([]);
const medicoId = ref<number | null>(null);
const fecha = ref<string>(hoy());
const horarios = ref<Bloque[]>([]);
const bloqueElegido = ref<Bloque | null>(null);
const nombre = ref('');
const email = ref('');

// Formulario de entreturno
const entreMedicoId = ref<number | null>(null);
const entreFecha = ref<string>(hoy());
const entreHora = ref('');
const entreDuracion = ref<number | null>(null);
const entreNombre = ref('');
const entreEmail = ref('');
const insertandoEntre = ref(false);

// Transiciones de estado permitidas
const transiciones: Record<string, string[]> = {
  Programado: ['Confirmado', 'Cancelado'],
  Confirmado: ['En Sala de Espera', 'Cancelado'],
  'En Sala de Espera': ['Atendido', 'Cancelado'],
  Atendido: [],
  Cancelado: [],
};

// ---------- Formato ----------
const formatearFecha = (iso: string) => new Date(iso).toLocaleString('es-AR');

const formatearHora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
  });

const formatearDia = (clave: string) =>
  new Date(`${clave}T00:00:00`).toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

const claseEstado = (estado: string) =>
  estado.toLowerCase().replace(/ /g, '-');

const etiquetaTipo = (t: TipoProfesional) =>
  t === 'medico' ? 'Médico' : 'Enfermero';

// Nombre del profesional a partir de su id
const nombreMedico = (id: number | null) =>
  medicos.value.find((m) => m.id === id)?.nombre ?? `Profesional ${id ?? ''}`;

// Minutos que dura un turno (muestra el tiempo reducido por un entreturno)
const minutosTurno = (t: Turno) =>
  Math.round(
    (new Date(t.fechaHoraFin).getTime() -
      new Date(t.fechaHoraInicio).getTime()) /
      60000,
  );

// ---------- Datos derivados ----------
const turnosOrdenados = computed(() =>
  [...turnos.value].sort(
    (a, b) =>
      new Date(a.fechaHoraInicio).getTime() -
      new Date(b.fechaHoraInicio).getTime(),
  ),
);

// ---------- Mensajes ----------
// Nest puede devolver message como texto o como lista (ValidationPipe)
const leerError = async (res: Response, porDefecto: string) => {
  try {
    const data = await res.json();
    return Array.isArray(data.message)
      ? data.message.join(', ')
      : data.message || porDefecto;
  } catch {
    return porDefecto;
  }
};

const mostrarAviso = (tipo: Aviso['tipo'], texto: string) => {
  aviso.value = { tipo, texto };
};

// ---------- Llamadas al backend ----------
const obtenerTurnos = async () => {
  cargando.value = true;
  error.value = null;
  try {
    const res = await fetch(`${API_URL}/turnos`);
    if (!res.ok) throw new Error('No se pudo obtener la lista de turnos.');
    turnos.value = await res.json();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    cargando.value = false;
  }
};

const obtenerMedicos = async () => {
  try {
    const res = await fetch(`${API_URL}/medicos`);
    if (!res.ok) throw new Error('No se pudo obtener la lista de profesionales.');
    medicos.value = await res.json();

    // Mantener la elección actual; solo pasar al primero si no hay una válida
    if (!medicos.value.some((m) => m.id === medicoId.value)) {
      medicoId.value = medicos.value[0]?.id ?? null; // el watch pide sus horarios
    }
    if (!medicos.value.some((m) => m.id === entreMedicoId.value)) {
      entreMedicoId.value = medicos.value[0]?.id ?? null;
    }
  } catch (err: any) {
    mostrarAviso('error', err.message);
  }
};

const obtenerHorarios = async () => {
  bloqueElegido.value = null;

  if (!medicoId.value || !fecha.value) {
    horarios.value = [];
    return;
  }

  cargandoHorarios.value = true;
  try {
    const params = new URLSearchParams({
      medicoId: String(medicoId.value),
      fecha: fecha.value,
    });
    const res = await fetch(`${API_URL}/turnos/disponibles?${params}`);
    if (!res.ok) {
      throw new Error(
        await leerError(res, 'No se pudieron obtener los horarios.'),
      );
    }
    horarios.value = await res.json();
  } catch (err: any) {
    horarios.value = [];
    mostrarAviso('error', err.message);
  } finally {
    cargandoHorarios.value = false;
  }
};

const reservarTurno = async () => {
  if (!bloqueElegido.value || !medicoId.value) return;

  const detalle = `${formatearDia(fecha.value)}, ${formatearHora(bloqueElegido.value.inicio)}`;

  reservando.value = true;
  aviso.value = null;
  try {
    const res = await fetch(`${API_URL}/turnos/solicitar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nombre.value,
        email: email.value,
        medicoId: medicoId.value,
        fechaHoraInicio: bloqueElegido.value.inicio,
        fechaHoraFin: bloqueElegido.value.fin,
      }),
    });

    if (!res.ok) throw new Error(await leerError(res, 'No se pudo reservar.'));

    mostrarAviso('ok', `Turno reservado para el ${detalle}.`);
    nombre.value = '';
    email.value = '';
  } catch (err: any) {
    mostrarAviso('error', err.message);
  } finally {
    reservando.value = false;
    // Refrescar ambos: el horario reservado (u ocupado por otra persona) desaparece
    await Promise.all([obtenerTurnos(), obtenerHorarios()]);
  }
};

const insertarEntreturno = async () => {
  if (!entreMedicoId.value || !entreHora.value) return;

  insertandoEntre.value = true;
  aviso.value = null;
  try {
    const body: Record<string, unknown> = {
      nombre: entreNombre.value,
      email: entreEmail.value,
      medicoId: entreMedicoId.value,
      fechaHoraInicio: new Date(
        `${entreFecha.value}T${entreHora.value}:00`,
      ).toISOString(),
    };
    if (entreDuracion.value) body.duracionMinutos = entreDuracion.value;

    const res = await fetch(`${API_URL}/turnos/entreturno`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(
        await leerError(res, 'No se pudo insertar el entreturno.'),
      );
    }

    mostrarAviso('ok', `Entreturno insertado a las ${entreHora.value}.`);
    entreNombre.value = '';
    entreEmail.value = '';
    entreHora.value = '';
    entreDuracion.value = null;
  } catch (err: any) {
    mostrarAviso('error', err.message);
  } finally {
    insertandoEntre.value = false;
    await Promise.all([obtenerTurnos(), obtenerHorarios()]);
  }
};

const cambiarEstado = async (turnoId: number, nuevoEstado: string) => {
  aviso.value = null;
  try {
    const res = await fetch(`${API_URL}/turnos/${turnoId}/estado`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nuevoEstado }),
    });

    if (!res.ok) {
      throw new Error(await leerError(res, 'Transición no permitida.'));
    }

    mostrarAviso('ok', `Turno #${turnoId} pasó a "${nuevoEstado}".`);
    await Promise.all([obtenerTurnos(), obtenerHorarios()]);
  } catch (err: any) {
    mostrarAviso('error', err.message);
  }
};

// Al cambiar profesional o fecha, pedir de nuevo los horarios libres
watch([medicoId, fecha], obtenerHorarios);

// Al cargar los profesionales se elige el primero y el watch pide sus horarios
onMounted(() => {
  obtenerTurnos();
  obtenerMedicos();
});
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Admisión y Turnos</h1>
        <p class="subtitulo">Reserva y seguimiento de turnos médicos</p>
      </div>
      <button
        class="btn btn-secundario"
        :disabled="cargando"
        @click="obtenerTurnos"
      >
        {{ cargando ? 'Actualizando…' : 'Actualizar lista' }}
      </button>
    </header>

    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">
      {{ aviso.texto }}
    </p>

    <!-- Reserva -->
    <section class="tarjeta">
      <h2>Reservar un Turno</h2>

      <form class="form-reserva" @submit.prevent="reservarTurno">
        <div class="fila">
          <label>
            Profesional
            <select v-model.number="medicoId" required>
              <option v-for="m in medicos" :key="m.id" :value="m.id">
                {{ m.nombre }} ({{ etiquetaTipo(m.tipo) }}) —
                {{ m.especialidad }}
              </option>
            </select>
          </label>

          <label>
            Fecha
            <input v-model="fecha" type="date" :min="hoy()" required />
          </label>
        </div>

        <div class="fila">
          <label>
            Nombre y apellido del paciente
            <input
              v-model="nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              minlength="2"
              maxlength="120"
              autocomplete="off"
              required
            />
          </label>

          <label>
            Email del paciente
            <input
              v-model="email"
              type="email"
              placeholder="Ej: juan@correo.com"
              maxlength="160"
              autocomplete="off"
              required
            />
          </label>
        </div>

        <fieldset class="horarios-campo">
          <legend>
            Horarios libres
            <span v-if="!cargandoHorarios" class="contador">
              {{ horarios.length }}
            </span>
          </legend>

          <p v-if="cargandoHorarios" class="nota">Buscando horarios…</p>
          <p v-else-if="!horarios.length" class="nota">
            No hay horarios libres: el profesional no atiende ese día o ya
            están todos ocupados.
          </p>

          <div v-else class="horarios">
            <button
              v-for="b in horarios"
              :key="b.inicio"
              type="button"
              class="horario"
              :class="{ elegido: b.inicio === bloqueElegido?.inicio }"
              :aria-pressed="b.inicio === bloqueElegido?.inicio"
              @click="bloqueElegido = b"
            >
              {{ formatearHora(b.inicio) }}
            </button>
          </div>
        </fieldset>

        <div class="fila fila-final">
          <p v-if="bloqueElegido" class="resumen">
            {{ formatearDia(fecha) }}, {{ formatearHora(bloqueElegido.inicio) }}
            a {{ formatearHora(bloqueElegido.fin) }} ·
            {{ nombreMedico(medicoId) }}
          </p>
          <p v-else class="nota">Elegí un horario.</p>

          <button
            type="submit"
            class="btn btn-primario"
            :disabled="reservando || !bloqueElegido"
          >
            {{ reservando ? 'Reservando…' : 'Reservar Turno' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Entreturno -->
    <section class="tarjeta">
      <h2>Insertar Entreturno</h2>

      <form class="form-reserva" @submit.prevent="insertarEntreturno">
        <div class="fila">
          <label>
            Profesional
            <select v-model.number="entreMedicoId" required>
              <option v-for="m in medicos" :key="m.id" :value="m.id">
                {{ m.nombre }} ({{ etiquetaTipo(m.tipo) }}) —
                {{ m.especialidad }}
              </option>
            </select>
          </label>

          <label>
            Fecha
            <input v-model="entreFecha" type="date" :min="hoy()" required />
          </label>

          <label>
            Hora exacta
            <input v-model="entreHora" type="time" required />
          </label>

          <label>
            Duración (min, opcional)
            <input
              v-model.number="entreDuracion"
              type="number"
              min="5"
              max="120"
              step="5"
            />
          </label>
        </div>

        <div class="fila">
          <label>
            Nombre y apellido del paciente
            <input
              v-model="entreNombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              minlength="2"
              maxlength="120"
              autocomplete="off"
              required
            />
          </label>

          <label>
            Email del paciente
            <input
              v-model="entreEmail"
              type="email"
              placeholder="Ej: juan@correo.com"
              maxlength="160"
              autocomplete="off"
              required
            />
          </label>
        </div>

        <div class="fila fila-final">
          <p class="nota">
            Recorta el turno que está en curso a esa hora y usa el tiempo
            liberado.
          </p>

          <button
            type="submit"
            class="btn btn-primario"
            :disabled="insertandoEntre || !entreHora"
          >
            {{ insertandoEntre ? 'Insertando…' : 'Insertar Entreturno' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Turnos reservados -->
    <section class="tarjeta">
      <h2>Turnos Reservados</h2>

      <p v-if="error" class="aviso error">{{ error }}</p>
      <p v-else-if="cargando && !turnos.length" class="nota">
        Cargando turnos…
      </p>
      <p v-else-if="!turnos.length" class="nota">
        Todavía no hay turnos reservados.
      </p>

      <div v-if="turnos.length" class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Profesional</th>
              <th>Paciente</th>
              <th>Fecha y hora</th>
              <th>Estado</th>
              <th>Cambiar estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="turno in turnosOrdenados" :key="turno.id">
              <td><span class="id-chip">#{{ turno.id }}</span></td>
              <td>{{ nombreMedico(turno.medicoId) }}</td>
              <td class="fuerte">
                {{
                  turno.pacienteNombre ??
                  (turno.pacienteId
                    ? `Paciente #${turno.pacienteId}`
                    : 'Sin asignar')
                }}
              </td>
              <td>
                {{ formatearFecha(turno.fechaHoraInicio) }}
                <span class="nota">· {{ minutosTurno(turno) }} min</span>
              </td>
              <td>
                <span :class="['badge', claseEstado(turno.estado)]">
                  {{ turno.estado }}
                </span>
                <span v-if="turno.esEntreturno" class="badge entreturno">
                  Entreturno
                </span>
                <span
                  v-if="turno.duracionReducida"
                  class="badge reducido"
                  title="Este turno fue acortado por un entreturno"
                >
                  Tiempo reducido
                </span>
              </td>
              <td class="acciones">
                <button
                  v-for="siguiente in transiciones[turno.estado] ?? []"
                  :key="siguiente"
                  class="btn btn-accion"
                  :class="{ peligro: siguiente === 'Cancelado' }"
                  @click="cambiarEstado(turno.id, siguiente)"
                >
                  {{ siguiente }}
                </button>
                <span
                  v-if="!(transiciones[turno.estado] ?? []).length"
                  class="nota"
                >
                  —
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
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