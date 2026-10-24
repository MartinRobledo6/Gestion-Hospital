<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue';

// ---------- Tipos ----------
type TipoProfesional = 'medico' | 'enfermero';

interface Horario {
  id: number;
  medicoId: number;
  diaSemana: number;
  horaInicio: string;
  horaFin: string;
  duracionIntervaloMinutos: number;
}

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

interface Medico {
  id: number;
  nombre: string;
  tipo: TipoProfesional;
  especialidadId: number | null;
  especialidad: string;
}

interface Especialidad {
  id: number;
  nombre: string;
  tipo: TipoProfesional;
}

const API_URL = 'http://localhost:3000/admision';

const DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

// Evita el "possibly undefined" al acceder por índice
const nombreDia = (n: number) => DIAS[n] ?? '';

const etiquetaTipo = (t: TipoProfesional) =>
  t === 'medico' ? 'Médico' : 'Enfermero';

// ---------- Estado ----------
const medicos = ref<Medico[]>([]);
const especialidades = ref<Especialidad[]>([]);
const medicoId = ref<number | null>(null);
const horarios = ref<Horario[]>([]);
const cargando = ref(false);
const guardando = ref(false);
const aviso = ref<Aviso | null>(null);

// Formulario de nuevo profesional
const nuevoNombre = ref('');
const nuevoTipo = ref<TipoProfesional>('medico');
const nuevaEspecialidadId = ref<number | null>(null);
const guardandoMedico = ref(false);

// Formulario de nuevo horario
const diaSemana = ref<number>(1);
const horaInicio = ref('08:00');
const horaFin = ref('12:00');
const intervalo = ref<number>(30);

// ---------- Formato ----------
// SQL Server puede devolver '08:00:00.0000000': mostramos solo HH:mm
const hhmm = (h: string) => h.slice(0, 5);

const aMinutos = (h: string) => {
  const [hh = 0, mm = 0] = h.split(':').map(Number);
  return hh * 60 + mm;
};

const turnosPorDia = (h: Horario) =>
  Math.floor(
    (aMinutos(h.horaFin) - aMinutos(h.horaInicio)) / h.duracionIntervaloMinutos,
  );

// ---------- Datos derivados ----------
const medicoActual = computed(
  () => medicos.value.find((m) => m.id === medicoId.value) ?? null,
);

const horariosOrdenados = computed(() =>
  [...horarios.value].sort((a, b) => a.diaSemana - b.diaSemana),
);

// Días que todavía no tienen horario (solo se permite uno por día)
const diasLibres = computed(() =>
  DIAS.map((nombre, valor) => ({ nombre, valor })).filter(
    (d) => !horarios.value.some((h) => h.diaSemana === d.valor),
  ),
);

// Solo las especialidades que corresponden al tipo elegido en el formulario
const especialidadesFiltradas = computed(() =>
  especialidades.value.filter((e) => e.tipo === nuevoTipo.value),
);

const previsualizacion = computed(() => {
  const total = aMinutos(horaFin.value) - aMinutos(horaInicio.value);
  if (!intervalo.value || total <= 0) return null;
  return Math.floor(total / intervalo.value);
});

// ---------- Mensajes ----------
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
const obtenerMedicos = async () => {
  try {
    const res = await fetch(`${API_URL}/medicos`);
    if (!res.ok) {
      throw new Error(
        await leerError(res, 'No se pudo obtener la lista de profesionales.'),
      );
    }
    medicos.value = await res.json();

    // Mantener el profesional elegido; solo pasar al primero si no hay uno válido
    if (!medicos.value.some((m) => m.id === medicoId.value)) {
      medicoId.value = medicos.value[0]?.id ?? null; // el watch pide sus horarios
    }
  } catch (err: any) {
    mostrarAviso('error', err.message);
  }
};

const obtenerEspecialidades = async () => {
  try {
    const res = await fetch(`${API_URL}/especialidades`);
    if (!res.ok) {
      throw new Error(
        await leerError(res, 'No se pudieron obtener las especialidades.'),
      );
    }
    // La especialidad seleccionada la resuelve el watch de especialidadesFiltradas
    especialidades.value = await res.json();
  } catch (err: any) {
    mostrarAviso('error', err.message);
  }
};

const agregarMedico = async () => {
  guardandoMedico.value = true;
  aviso.value = null;
  try {
    const res = await fetch(`${API_URL}/medicos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: nuevoNombre.value,
        tipo: nuevoTipo.value,
        especialidadId: nuevaEspecialidadId.value,
      }),
    });

    if (!res.ok) {
      throw new Error(await leerError(res, 'No se pudo guardar el profesional.'));
    }

    const creado: Medico = await res.json();
    nuevoNombre.value = '';

    await obtenerMedicos();
    medicoId.value = creado.id; // queda seleccionado para cargarle los horarios

    // El watch de medicoId limpia el aviso: mostrarlo después de que corra
    await nextTick();
    mostrarAviso('ok', `${creado.nombre} agregado.`);
  } catch (err: any) {
    mostrarAviso('error', err.message);
  } finally {
    guardandoMedico.value = false;
  }
};

const obtenerHorarios = async () => {
  if (!medicoId.value) {
    horarios.value = [];
    return;
  }

  cargando.value = true;
  try {
    const res = await fetch(`${API_URL}/medicos/${medicoId.value}/horarios`);
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
    cargando.value = false;
  }
};

const agregarHorario = async () => {
  if (!medicoId.value) return;

  guardando.value = true;
  aviso.value = null;
  try {
    const res = await fetch(`${API_URL}/medicos/${medicoId.value}/horarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        diaSemana: diaSemana.value,
        horaInicio: horaInicio.value,
        horaFin: horaFin.value,
        duracionIntervaloMinutos: intervalo.value,
      }),
    });

    if (!res.ok) {
      throw new Error(await leerError(res, 'No se pudo guardar el horario.'));
    }

    mostrarAviso(
      'ok',
      `Horario del ${nombreDia(diaSemana.value).toLowerCase()} guardado.`,
    );
    await obtenerHorarios();

    // Dejar seleccionado el próximo día libre
    diaSemana.value = diasLibres.value[0]?.valor ?? diaSemana.value;
  } catch (err: any) {
    mostrarAviso('error', err.message);
  } finally {
    guardando.value = false;
  }
};

const eliminarHorario = async (h: Horario) => {
  if (
    !confirm(`¿Quitar el horario del ${nombreDia(h.diaSemana).toLowerCase()}?`)
  ) {
    return;
  }

  aviso.value = null;
  try {
    const res = await fetch(`${API_URL}/medicos/horarios/${h.id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      throw new Error(await leerError(res, 'No se pudo eliminar el horario.'));
    }
    mostrarAviso('ok', 'Horario eliminado.');
    await obtenerHorarios();
  } catch (err: any) {
    mostrarAviso('error', err.message);
  }
};

// ---------- Watchers y ciclo de vida ----------
watch(medicoId, () => {
  aviso.value = null;
  obtenerHorarios();
});

// Si el día elegido ya tiene horario, pasar al primer día libre
watch(diasLibres, (lista) => {
  const primero = lista[0];
  if (primero && !lista.some((d) => d.valor === diaSemana.value)) {
    diaSemana.value = primero.valor;
  }
});

// Si la especialidad elegida ya no está en la lista filtrada, pasar a la primera.
// Cubre tanto el cambio de tipo como la llegada de las especialidades del backend.
watch(especialidadesFiltradas, (lista) => {
  if (!lista.some((e) => e.id === nuevaEspecialidadId.value)) {
    nuevaEspecialidadId.value = lista[0]?.id ?? null;
  }
});

onMounted(() => {
  obtenerMedicos();
  obtenerEspecialidades();
});
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <h1>Médicos y Horarios</h1>
      <p class="subtitulo">Alta de profesionales y horarios de atención</p>
    </header>

    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">
      {{ aviso.texto }}
    </p>

    <!-- Alta de profesional -->
    <section class="tarjeta">
      <h2>Nuevo Profesional</h2>

      <form class="form" @submit.prevent="agregarMedico">
        <div class="fila">
          <label>
            Nombre y apellido
            <input
              v-model="nuevoNombre"
              type="text"
              placeholder="Ej: Dr. Juan Pérez"
              minlength="2"
              maxlength="120"
              autocomplete="off"
              required
            />
          </label>

          <label>
            Tipo
            <select v-model="nuevoTipo" required>
              <option value="medico">Médico</option>
              <option value="enfermero">Enfermero</option>
            </select>
          </label>

          <label>
            Especialidad
            <select v-model.number="nuevaEspecialidadId" required>
              <option
                v-for="e in especialidadesFiltradas"
                :key="e.id"
                :value="e.id"
              >
                {{ e.nombre }}
              </option>
            </select>
          </label>

          <button
            type="submit"
            class="btn btn-primario"
            :disabled="guardandoMedico || !nuevaEspecialidadId"
          >
            {{ guardandoMedico ? 'Guardando…' : 'Guardar Profesional' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Selector de profesional -->
    <section class="tarjeta">
      <p v-if="!medicos.length" class="nota">
        Todavía no hay profesionales cargados. Agregá el primero arriba.
      </p>

      <label v-else class="campo-medico">
        Profesional
        <select v-model.number="medicoId">
          <option v-for="m in medicos" :key="m.id" :value="m.id">
            {{ m.nombre }} ({{ etiquetaTipo(m.tipo) }}) — {{ m.especialidad }}
          </option>
        </select>
      </label>
    </section>

    <!-- Horarios cargados -->
    <section v-if="medicoActual" class="tarjeta">
      <h2>
        Horarios de atención de {{ medicoActual.nombre }}
        <span class="especialidad">· {{ medicoActual.especialidad }}</span>
      </h2>

      <p v-if="cargando" class="nota">Cargando horarios…</p>
      <p v-else-if="!horarios.length" class="nota">
        Este profesional todavía no tiene horarios cargados.
      </p>

      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Día</th>
              <th>Desde</th>
              <th>Hasta</th>
              <th>Intervalo</th>
              <th>Turnos por día</th>
              <th class="centro">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in horariosOrdenados" :key="h.id">
              <td><span class="id-chip">#{{ h.id }}</span></td>
              <td class="fuerte">{{ nombreDia(h.diaSemana) }}</td>
              <td>{{ hhmm(h.horaInicio) }}</td>
              <td>{{ hhmm(h.horaFin) }}</td>
              <td>{{ h.duracionIntervaloMinutos }} min</td>
              <td>
                <span class="badge verde">{{ turnosPorDia(h) }} turnos</span>
              </td>
              <td class="centro">
                <button class="btn btn-peligro" @click="eliminarHorario(h)">
                  Eliminar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Alta de horario -->
    <section v-if="medicoActual" class="tarjeta">
      <h2>Nuevo Horario</h2>

      <p v-if="!diasLibres.length" class="nota">
        Ya hay un horario cargado para todos los días de la semana.
      </p>

      <form v-else class="form" @submit.prevent="agregarHorario">
        <div class="fila">
          <label>
            Día
            <select v-model.number="diaSemana" required>
              <option v-for="d in diasLibres" :key="d.valor" :value="d.valor">
                {{ d.nombre }}
              </option>
            </select>
          </label>

          <label>
            Desde
            <input v-model="horaInicio" type="time" required />
          </label>

          <label>
            Hasta
            <input v-model="horaFin" type="time" required />
          </label>

          <label>
            Intervalo (min)
            <input
              v-model.number="intervalo"
              type="number"
              min="5"
              max="240"
              step="5"
              required
            />
          </label>

          <button
            type="submit"
            class="btn btn-primario"
            :disabled="guardando || !medicoId || previsualizacion === null"
          >
            {{ guardando ? 'Guardando…' : 'Guardar Horario' }}
          </button>
        </div>

        <p v-if="previsualizacion !== null" class="nota">
          Genera {{ previsualizacion }} turnos posibles por día.
        </p>
        <p v-else class="nota">
          La hora de fin tiene que ser posterior a la de inicio.
        </p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.vista {
  --azul: #0a7bc4;
  --azul-oscuro: #0866a2;
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
  margin-bottom: 24px;
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

.especialidad {
  font-weight: 400;
  color: var(--suave);
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

/* Campos */
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
  min-width: 140px;
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

.campo-medico select {
  max-width: 360px;
}

select:focus-visible,
input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--azul);
  outline-offset: 2px;
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

.btn-peligro {
  padding: 5px 14px;
  background: #fff;
  border-color: #dc2626;
  color: #dc2626;
}

.btn-peligro:hover {
  background: #fef2f2;
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

.tabla .centro {
  text-align: center;
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

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.badge.verde {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 600px) {
  select,
  input,
  .campo-medico select {
    min-width: 0;
    max-width: none;
    width: 100%;
  }

  label,
  .fila .btn {
    width: 100%;
  }
}
</style>