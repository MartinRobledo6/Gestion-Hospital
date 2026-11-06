<script setup lang="ts">
import { computed, ref } from 'vue';
import { apiFetch } from '../api';
import { useAuthStore } from '../stores/auth';
import { usePolling } from '../composable/usepolling';

// ---------- Tipos ----------
interface Ingreso {
  id: number;
  pacienteNombre: string;
  documento: string | null;
  motivoConsulta: string;
  nivel: number;
  estado: string;
  fechaIngreso: string;
  fechaAtencion: string | null;
  medicoUsuarioId: number | null;
  medicoNombre?: string | null;
  posicion?: number;
}

interface Cola {
  enEspera: Ingreso[];
  enAtencion: Ingreso[];
}

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

const API_URL = 'http://localhost:3000/admision/guardia';
const INTERVALO_MS = 10_000;

// Copia de NivelTriaje del backend (escala Manchester)
const NIVELES = [
  { valor: 1, nombre: 'Riesgo vital', detalle: 'Rojo · inmediato', clase: 'rojo' },
  { valor: 2, nombre: 'Muy urgente', detalle: 'Naranja · 10 min', clase: 'naranja' },
  { valor: 3, nombre: 'Urgente', detalle: 'Amarillo · 60 min', clase: 'amarillo' },
  { valor: 4, nombre: 'Poco urgente', detalle: 'Verde · 2 h', clase: 'verde' },
  { valor: 5, nombre: 'No urgente', detalle: 'Azul · 4 h', clase: 'azul' },
];

const nivelInfo = (valor: number) =>
  NIVELES.find((n) => n.valor === valor) ?? {
    valor,
    nombre: `Nivel ${valor}`,
    detalle: '',
    clase: 'azul',
  };

const auth = useAuthStore();
const puedeRegistrar = computed(() => auth.rol === 'ENFERMERO' || auth.rol === 'ADMINISTRADOR');
const puedeAtender = computed(() => auth.rol === 'MEDICO' || auth.rol === 'ADMINISTRADOR');

// ---------- Estado ----------
const cola = ref<Cola>({ enEspera: [], enAtencion: [] });
const error = ref<string | null>(null);
const aviso = ref<Aviso | null>(null);
const enviando = ref(false);

const formVacio = () => ({ pacienteNombre: '', documento: '', motivoConsulta: '', nivel: 3 });
const form = ref(formVacio());

const rojosEnEspera = computed(() => cola.value.enEspera.filter((i) => i.nivel === 1));

// ---------- Formato ----------
const minutosDesde = (iso: string) =>
  Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

const leerError = async (res: Response, porDefecto: string) => {
  try {
    const data = await res.json();
    return Array.isArray(data.message) ? data.message.join(', ') : data.message || porDefecto;
  } catch {
    return porDefecto;
  }
};

// ---------- Llamadas al backend ----------
const cargarCola = async () => {
  try {
    const res = await apiFetch(`${API_URL}/cola`);
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo obtener la cola de guardia.'));
    cola.value = await res.json();
    error.value = null;
  } catch (err: any) {
    error.value = err.message;
  }
};

// Es el "monitor": se actualiza solo cada 10 segundos
usePolling(cargarCola, INTERVALO_MS);

const registrarIngreso = async () => {
  enviando.value = true;
  aviso.value = null;
  try {
    const documento = form.value.documento.trim();
    const body = {
      pacienteNombre: form.value.pacienteNombre.trim(),
      motivoConsulta: form.value.motivoConsulta.trim(),
      nivel: form.value.nivel,
      ...(documento ? { documento } : {}),
    };
    const res = await apiFetch(`${API_URL}/ingresos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo registrar el ingreso.'));

    const ingreso: Ingreso = await res.json();
    aviso.value = {
      tipo: 'ok',
      texto: `${ingreso.pacienteNombre} ingresó como ${nivelInfo(ingreso.nivel).nombre}. Posición en la cola: ${ingreso.posicion}.`,
    };
    form.value = formVacio();
    await cargarCola();
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message };
  } finally {
    enviando.value = false;
  }
};

const atenderSiguiente = async () => {
  aviso.value = null;
  try {
    const res = await apiFetch(`${API_URL}/atender-siguiente`, { method: 'POST' });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo llamar al siguiente paciente.'));
    const ingreso: Ingreso = await res.json();
    aviso.value = { tipo: 'ok', texto: `Llamaste a ${ingreso.pacienteNombre}.` };
    await cargarCola();
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message };
  }
};

const finalizar = async (ingreso: Ingreso) => {
  aviso.value = null;
  try {
    const res = await apiFetch(`${API_URL}/ingresos/${ingreso.id}/finalizar`, { method: 'PATCH' });
    if (!res.ok) throw new Error(await leerError(res, 'No se pudo finalizar la atención.'));
    aviso.value = { tipo: 'ok', texto: `Atención de ${ingreso.pacienteNombre} finalizada.` };
    await cargarCola();
  } catch (err: any) {
    aviso.value = { tipo: 'error', texto: err.message };
  }
};

const esMio = (i: Ingreso) =>
  auth.rol === 'ADMINISTRADOR' || i.medicoUsuarioId === auth.usuario?.id;
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Guardia</h1>
        <p class="subtitulo">Triaje y cola de atención · se actualiza cada 10 segundos</p>
      </div>
      <button class="btn btn-secundario" @click="cargarCola()">Actualizar</button>
    </header>

    <!-- Alerta destacada: hay pacientes con riesgo vital esperando -->
    <div v-if="rojosEnEspera.length" class="alerta-roja" role="alert">
      <strong>CÓDIGO ROJO</strong>
      {{ rojosEnEspera.length === 1 ? 'Hay 1 paciente' : `Hay ${rojosEnEspera.length} pacientes` }}
      con riesgo vital esperando:
      {{ rojosEnEspera.map((i) => i.pacienteNombre).join(', ') }}
    </div>

    <p v-if="error" class="aviso error" role="alert">{{ error }}</p>
    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">{{ aviso.texto }}</p>

    <!-- Registro de triaje (enfermería) -->
    <section v-if="puedeRegistrar" class="tarjeta">
      <h2>Nuevo ingreso</h2>
      <form class="form" @submit.prevent="registrarIngreso">
        <div class="fila">
          <label>
            Nombre del paciente
            <input v-model="form.pacienteNombre" required minlength="2" placeholder="Ej: Carlos López" />
          </label>
          <label>
            DNI (opcional)
            <input v-model="form.documento" inputmode="numeric" placeholder="Ej: 30111222" />
          </label>
        </div>

        <label>
          Motivo de consulta
          <input v-model="form.motivoConsulta" required minlength="3" placeholder="Ej: dolor torácico" />
        </label>

        <fieldset class="niveles">
          <legend>Nivel de triaje</legend>
          <label
            v-for="n in NIVELES"
            :key="n.valor"
            :class="['nivel-opcion', n.clase, { elegido: form.nivel === n.valor }]"
          >
            <input v-model="form.nivel" type="radio" name="nivel" :value="n.valor" />
            <span class="nivel-nombre">{{ n.nombre }}</span>
            <span class="nivel-detalle">{{ n.detalle }}</span>
          </label>
        </fieldset>

        <div class="fila-final">
          <button class="btn btn-primario" :disabled="enviando">
            {{ enviando ? 'Registrando…' : 'Registrar ingreso' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Cola de espera -->
    <section class="tarjeta">
      <h2 class="titulo-con-accion">
        En espera ({{ cola.enEspera.length }})
        <button
          v-if="puedeAtender && cola.enEspera.length"
          class="btn btn-primario"
          @click="atenderSiguiente"
        >
          Llamar al siguiente
        </button>
      </h2>

      <p v-if="!cola.enEspera.length" class="nota">No hay pacientes esperando.</p>

      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Nivel</th>
              <th>Paciente</th>
              <th>Motivo</th>
              <th>Espera</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in cola.enEspera" :key="i.id" :class="{ 'fila-roja': i.nivel === 1 }">
              <td class="fuerte">{{ i.posicion }}</td>
              <td>
                <span :class="['badge', nivelInfo(i.nivel).clase]">{{ nivelInfo(i.nivel).nombre }}</span>
              </td>
              <td class="fuerte">
                {{ i.pacienteNombre }}
                <span v-if="i.documento" class="nota">· DNI {{ i.documento }}</span>
              </td>
              <td class="motivo">{{ i.motivoConsulta }}</td>
              <td>{{ minutosDesde(i.fechaIngreso) }} min <span class="nota">(desde {{ hora(i.fechaIngreso) }})</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- En atención -->
    <section class="tarjeta">
      <h2>En atención ({{ cola.enAtencion.length }})</h2>
      <p v-if="!cola.enAtencion.length" class="nota">Nadie está siendo atendido.</p>

      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Nivel</th>
              <th>Paciente</th>
              <th>Médico</th>
              <th>Desde</th>
              <!-- Solo el médico (o el admin) finaliza: el enfermero no ve esta columna -->
              <th v-if="puedeAtender">Acción</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="i in cola.enAtencion" :key="i.id">
              <td>
                <span :class="['badge', nivelInfo(i.nivel).clase]">{{ nivelInfo(i.nivel).nombre }}</span>
              </td>
              <td class="fuerte">{{ i.pacienteNombre }}</td>
              <td>{{ i.medicoNombre ?? '—' }}</td>
              <td>{{ i.fechaAtencion ? hora(i.fechaAtencion) : '—' }}</td>
              <td v-if="puedeAtender">
                <button v-if="esMio(i)" class="btn btn-accion" @click="finalizar(i)">
                  Finalizar
                </button>
                <span v-else class="nota">—</span>
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
  --texto: #1e293b;
  --suave: #64748b;
  --borde: #e2e8f0;

  max-width: 960px;
  margin: 0 auto;
  padding: 40px 16px 64px;
  color: var(--texto);
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  line-height: 1.5;
}

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
.titulo-con-accion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Alerta de código rojo */
.alerta-roja {
  margin-bottom: 24px;
  padding: 14px 16px;
  border-radius: 8px;
  background: #dc2626;
  color: #fff;
  font-weight: 600;
  animation: latido 1.5s ease-in-out infinite;
}
.alerta-roja strong {
  margin-right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fff;
  color: #dc2626;
}
@keyframes latido {
  0%, 100% { box-shadow: 0 0 0 0 rgba(220, 38, 38, 0.5); }
  50% { box-shadow: 0 0 0 8px rgba(220, 38, 38, 0); }
}
@media (prefers-reduced-motion: reduce) {
  .alerta-roja { animation: none; }
}

/* Formulario */
.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.fila {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.fila > label {
  flex: 1 1 220px;
}
.fila-final {
  display: flex;
  justify-content: flex-end;
}
label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--suave);
}
input {
  padding: 10px 12px;
  border: 1px solid var(--borde);
  border-radius: 6px;
  font: inherit;
  font-weight: 400;
  color: var(--texto);
}
input:focus-visible,
button:focus-visible {
  outline: 2px solid var(--azul);
  outline-offset: 2px;
}

/* Selector de nivel */
.niveles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 8px;
  margin: 0;
  padding: 0;
  border: 0;
}
.niveles legend {
  margin-bottom: 10px;
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--suave);
}
.nivel-opcion {
  gap: 2px;
  padding: 10px 12px;
  border: 2px solid var(--borde);
  border-radius: 8px;
  cursor: pointer;
}
.nivel-opcion input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.nivel-opcion.elegido {
  border-color: currentColor;
}
.nivel-nombre {
  font-size: 0.95rem;
  font-weight: 700;
}
.nivel-detalle {
  font-size: 0.75rem;
  font-weight: 500;
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
.btn-secundario:hover {
  background: #f1f5f9;
}
.btn-accion {
  padding: 5px 12px;
  background: var(--azul);
  border-color: var(--azul);
  color: #fff;
  font-size: 0.8rem;
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
  font-size: 0.85rem;
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
.tabla .motivo {
  white-space: normal;
  min-width: 180px;
}
.fila-roja td {
  background: #fef2f2;
}
.fuerte {
  font-weight: 700;
}

/* Colores de triaje (badges y opciones) */
.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}
.rojo { background: #fee2e2; color: #b91c1c; }
.naranja { background: #ffedd5; color: #c2410c; }
.amarillo { background: #fef9c3; color: #a16207; }
.verde { background: #dcfce7; color: #15803d; }
.azul { background: #dbeafe; color: #1d4ed8; }

@media (max-width: 600px) {
  .encabezado,
  .titulo-con-accion {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>