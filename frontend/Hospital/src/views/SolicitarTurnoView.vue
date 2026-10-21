<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';

interface Bloque {
  inicio: string;
  fin: string;
}
interface Medico {
  id: number;
  nombre: string;
  especialidad: string;
}

const API_URL = 'http://localhost:3000/admision';

// Fecha local de hoy en formato YYYY-MM-DD
const hoy = () => {
  const f = new Date();
  const mes = String(f.getMonth() + 1).padStart(2, '0');
  const dia = String(f.getDate()).padStart(2, '0');
  return `${f.getFullYear()}-${mes}-${dia}`;
};

const nombre = ref('');
const email = ref('');
const medicos = ref<Medico[]>([]); 
const medicoId = ref<number | null>(null);
const fecha = ref(hoy());
const horarios = ref<Bloque[]>([]);
const bloqueElegido = ref<Bloque | null>(null);

const cargandoHorarios = ref(false);
const enviando = ref(false);
const error = ref<string | null>(null);
const confirmacion = ref<string | null>(null);

// ---------- Formato ----------
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

// Si el día elegido es hoy, no mostrar horarios que ya pasaron
const horariosFuturos = computed(() =>
  horarios.value.filter((b) => new Date(b.inicio).getTime() > Date.now()),
);

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

// ---------- Llamadas al backend ----------
const obtenerMedicos = async () => {
  try {
    const res = await fetch(`${API_URL}/medicos`);
    if (!res.ok) throw new Error('No se pudo obtener la lista de médicos.');
    medicos.value = await res.json();
    medicoId.value = medicos.value[0]?.id ?? null;   // <- cambio: agregar ?.id
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
    error.value = err.message;
  } finally {
    cargandoHorarios.value = false;
  }
};

const solicitarTurno = async () => {
  if (!bloqueElegido.value || !medicoId.value) return;

  const detalle = `${formatearDia(fecha.value)} a las ${formatearHora(bloqueElegido.value.inicio)}`;

  enviando.value = true;
  error.value = null;
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

    if (!res.ok) {
      throw new Error(await leerError(res, 'No se pudo reservar el turno.'));
    }

    confirmacion.value = `Tu turno quedó reservado para el ${detalle} con el médico ${medicoId.value}.`;
  } catch (err: any) {
    error.value = err.message;
    await obtenerHorarios(); // por si otra persona ocupó ese horario
  } finally {
    enviando.value = false;
  }
};

const pedirOtro = async () => {
  confirmacion.value = null;
  error.value = null;
  nombre.value = '';
  email.value = '';
  await obtenerHorarios();
};

watch([medicoId, fecha], obtenerHorarios);

onMounted(obtenerMedicos);
</script>

<template>
  <div class="pagina">
    <main class="vista">
      <header class="encabezado">
        <h1>Pedí tu turno</h1>
        <p class="subtitulo">Completá tus datos y elegí el día y horario</p>
      </header>

      <!-- Confirmación -->
      <section v-if="confirmacion" class="tarjeta">
        <p class="aviso ok" role="status">{{ confirmacion }}</p>
        <button class="btn btn-primario" @click="pedirOtro">
          Pedir otro turno
        </button>
      </section>

      <!-- Formulario -->
      <form v-else class="tarjeta form" @submit.prevent="solicitarTurno">
        <h2>Datos del turno</h2>

        <p v-if="error" class="aviso error" role="alert">{{ error }}</p>

        <div class="fila">
          <label>
            Nombre y apellido
            <input
              v-model="nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              minlength="2"
              maxlength="120"
              autocomplete="name"
              required
            />
          </label>

          <label>
            Email
            <input
              v-model="email"
              type="email"
              placeholder="Ej: juan@correo.com"
              maxlength="160"
              autocomplete="email"
              required
            />
          </label>
        </div>

        <div class="fila">
          <label>
            Médico
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

        <fieldset class="horarios-campo">
          <legend>
            Horarios libres
            <span v-if="!cargandoHorarios" class="contador">
              {{ horariosFuturos.length }}
            </span>
          </legend>

          <p v-if="cargandoHorarios" class="nota">Buscando horarios…</p>
          <p v-else-if="!horariosFuturos.length" class="nota">
            No hay horarios libres ese día. Probá con otra fecha.
          </p>

          <div v-else class="horarios">
            <button
              v-for="b in horariosFuturos"
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
          </p>
          <p v-else class="nota">Elegí un horario.</p>

          <button
            type="submit"
            class="btn btn-primario"
            :disabled="enviando || !bloqueElegido"
          >
            {{ enviando ? 'Reservando…' : 'Reservar turno' }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>

<style scoped>
.pagina {
  --azul: #0a7bc4;
  --azul-oscuro: #0866a2;
  --azul-claro: #eaf4fb;
  --texto: #1e293b;
  --suave: #64748b;
  --borde: #e2e8f0;
  --fondo: #f8fafc;

  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

.vista {
  max-width: 920px;
  margin: 0 auto;
  padding: 40px 16px 64px;
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

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form h2 {
  margin-bottom: 0;
}

.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.fila > label {
  flex: 1 1 220px;
}

.fila-final {
  justify-content: space-between;
  align-items: center;
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
  font-size: 0.9rem;
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

/* Avisos */
.aviso {
  margin: 0 0 16px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 0.9rem;
}

.form .aviso {
  margin: 0;
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

@media (max-width: 600px) {
  .fila-final {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>