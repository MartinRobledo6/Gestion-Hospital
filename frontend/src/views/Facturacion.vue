<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { apiFetch } from '../api';
import { useAuthStore } from '../stores/auth';

// ---------- Tipos ----------
interface Cobertura {
  Id: number;
  Nombre: string;
  Tipo: 'PUBLICA' | 'PREPAGA' | 'PARTICULAR';
  CopagoFijo: number;
}

interface Paciente {
  id: number;
  nombre: string;
  email: string;
  coberturaId: number | null;
  coberturaNombre: string;
  cuentaAbiertaId: number | null;
}

interface Cuenta {
  Id: number;
  PacienteId: number;
  pacienteNombre: string;
  Estado: string;
  FechaApertura: string;
  TotalCargoPaciente: number;
  TotalCargoTerceros: number;
}

interface Cargo {
  Id: number;
  Concepto: string;
  Detalle: string | null;
  Destinatario: 'PACIENTE' | 'ESTADO' | 'PREPAGA';
  Monto: number;
  ReferenciaEventoId: string | null;
  FechaCargo: string;
}

interface DetalleCuenta extends Cuenta {
  cobertura: { nombre: string; tipo: string; copagoFijo: number };
  cargos: Cargo[];
}

interface PrecioInsumo {
  Id: number;
  Insumo: string;
  PrecioUnitario: number;
}

// Lo que devuelve GET /facturacion/reportes/resumen
type ResumenFacturado = Record<Cargo['Destinatario'], number>;

interface Aviso {
  tipo: 'ok' | 'error';
  texto: string;
}

const API_URL = 'http://localhost:3000/facturacion';

const DESTINATARIOS: Record<Cargo['Destinatario'], string> = {
  PACIENTE: 'Paciente',
  ESTADO: 'Estado (subsidio)',
  PREPAGA: 'Prepaga',
};

const auth = useAuthStore();
const esAdmin = computed(() => auth.rol === 'ADMINISTRADOR');

// ---------- Estado ----------
const coberturas = ref<Cobertura[]>([]);
const pacientes = ref<Paciente[]>([]);
const cuentas = ref<Cuenta[]>([]);
const precios = ref<PrecioInsumo[]>([]);
const detalle = ref<DetalleCuenta | null>(null);
const resumen = ref<ResumenFacturado | null>(null);
const aviso = ref<Aviso | null>(null);
const enviando = ref(false);

const formPrestacion = ref({ concepto: 'Consulta Médica General', costoBase: 15000 });
const formInsumo = ref({ insumo: '', cantidad: 1 });

// ---------- Formato ----------
const pesos = (n: number) =>
  n.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
const fecha = (iso: string) =>
  new Date(iso).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

const leerError = async (res: Response, porDefecto: string) => {
  try {
    const data = await res.json();
    return Array.isArray(data.message) ? data.message.join(', ') : data.message || porDefecto;
  } catch {
    return porDefecto;
  }
};

// Envoltorio común: llama, valida el status y devuelve el JSON
const pedir = async <T>(ruta: string, porDefecto: string, options: RequestInit = {}) => {
  const res = await apiFetch(`${API_URL}${ruta}`, {
    ...options,
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(await leerError(res, porDefecto));
  return (await res.json()) as T;
};

// Total general: suma los tres destinatarios
const totalFacturado = computed(() =>
  resumen.value ? Object.values(resumen.value).reduce((a, b) => a + b, 0) : 0,
);

const mostrarError = (err: unknown) => {
  aviso.value = { tipo: 'error', texto: err instanceof Error ? err.message : String(err) };
};

// ---------- Carga ----------
const cargarTodo = async () => {
  try {
    const [c, p, cu, pr, re] = await Promise.all([
      pedir<Cobertura[]>('/coberturas', 'No se pudieron cargar las coberturas.'),
      pedir<Paciente[]>('/pacientes', 'No se pudieron cargar los pacientes.'),
      pedir<Cuenta[]>('/cuentas', 'No se pudieron cargar las cuentas.'),
      pedir<PrecioInsumo[]>('/precios-insumos', 'No se pudo cargar la lista de precios.'),
      pedir<ResumenFacturado>('/reportes/resumen', 'No se pudo cargar el resumen.'),
    ]);
    coberturas.value = c;
    pacientes.value = p;
    cuentas.value = cu;
    precios.value = pr;
    resumen.value = re;
    if (!formInsumo.value.insumo && pr[0]) formInsumo.value.insumo = pr[0].Insumo;
    if (detalle.value) await verCuenta(detalle.value.Id);
  } catch (err) {
    mostrarError(err);
  }
};

onMounted(cargarTodo);

const verCuenta = async (id: number | null) => {
  if (id === null) return;
  try {
    detalle.value = await pedir<DetalleCuenta>(`/cuentas/${id}`, 'No se pudo cargar la cuenta.');
  } catch (err) {
    mostrarError(err);
  }
};

// ---------- Acciones ----------
const cambiarCobertura = async (paciente: Paciente, valor: string) => {
  aviso.value = null;
  try {
    const coberturaId = valor === '' ? null : Number(valor);
    await pedir(`/pacientes/${paciente.id}/cobertura`, 'No se pudo asignar la cobertura.', {
      method: 'PATCH',
      body: JSON.stringify({ coberturaId }),
    });
    aviso.value = { tipo: 'ok', texto: `Cobertura de ${paciente.nombre} actualizada.` };
    await cargarTodo();
  } catch (err) {
    mostrarError(err);
  }
};

const abrirCuenta = async (paciente: Paciente) => {
  aviso.value = null;
  try {
    const cuenta = await pedir<Cuenta>('/cuentas', 'No se pudo abrir la cuenta.', {
      method: 'POST',
      body: JSON.stringify({ pacienteId: paciente.id }),
    });
    aviso.value = { tipo: 'ok', texto: `Cuenta #${cuenta.Id} abierta para ${paciente.nombre}.` };
    await cargarTodo();
    await verCuenta(cuenta.Id);
  } catch (err) {
    mostrarError(err);
  }
};

const cerrarCuenta = async () => {
  if (!detalle.value) return;
  aviso.value = null;
  try {
    await pedir(`/cuentas/${detalle.value.Id}/cerrar`, 'No se pudo cerrar la cuenta.', {
      method: 'PATCH',
    });
    aviso.value = { tipo: 'ok', texto: `Cuenta #${detalle.value.Id} cerrada.` };
    await cargarTodo();
  } catch (err) {
    mostrarError(err);
  }
};

// HU 1.1: el backend decide cuánto paga cada uno según la cobertura del paciente
const facturarPrestacion = async () => {
  if (!detalle.value) return;
  enviando.value = true;
  aviso.value = null;
  try {
    const cobro = await pedir<{ cobertura: string; paciente: number; terceros: number }>(
      `/cuentas/${detalle.value.Id}/cargos`,
      'No se pudo facturar la prestación.',
      {
        method: 'POST',
        body: JSON.stringify({
          concepto: formPrestacion.value.concepto.trim(),
          costoBase: Number(formPrestacion.value.costoBase),
        }),
      },
    );
    aviso.value = {
      tipo: 'ok',
      texto: `${cobro.cobertura}: el paciente abona ${pesos(cobro.paciente)} y se facturan ${pesos(cobro.terceros)} a terceros.`,
    };
    await cargarTodo();
  } catch (err) {
    mostrarError(err);
  } finally {
    enviando.value = false;
  }
};

// HU 2.1: simula el evento que emitiría Enfermería al administrar medicación
const simularMedicacion = async () => {
  if (!detalle.value) return;
  enviando.value = true;
  aviso.value = null;
  try {
    const { eventoId } = await pedir<{ eventoId: string }>(
      '/eventos/medicacion-administrada',
      'No se pudo emitir el evento.',
      {
        method: 'POST',
        body: JSON.stringify({
          pacienteId: detalle.value.PacienteId,
          insumo: formInsumo.value.insumo,
          cantidad: Number(formInsumo.value.cantidad),
        }),
      },
    );
    aviso.value = { tipo: 'ok', texto: `Evento ${eventoId.slice(0, 8)}… emitido.` };
    await cargarTodo();
  } catch (err) {
    mostrarError(err);
  } finally {
    enviando.value = false;
  }
};
</script>

<template>
  <main class="vista">
    <header class="encabezado">
      <div>
        <h1>Facturación</h1>
        <p class="subtitulo">Coberturas, cuentas de estadía y cargos</p>
      </div>
      <button class="btn btn-secundario" @click="cargarTodo()">Actualizar</button>
    </header>

    <p v-if="aviso" :class="['aviso', aviso.tipo]" role="status">{{ aviso.texto }}</p>

    <!-- Reporte: lo facturado (no lo cobrado) agrupado por destinatario -->
    <section v-if="resumen" class="tarjeta">
      <h2>Resumen de facturación</h2>
      <div class="totales">
        <div v-for="(nombre, clave) in DESTINATARIOS" :key="clave">
          <span class="nota">{{ nombre }}</span>
          <strong>{{ pesos(resumen[clave]) }}</strong>
        </div>
        <div class="total-general">
          <span class="nota">Total facturado</span>
          <strong>{{ pesos(totalFacturado) }}</strong>
        </div>
      </div>
    </section>

    <!-- Pacientes: cobertura registrada y apertura de cuenta -->
    <section class="tarjeta">
      <h2>Pacientes</h2>
      <p v-if="!pacientes.length" class="nota">
        Todavía no hay pacientes. Se registran al solicitar un turno.
      </p>
      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Cobertura</th>
              <th>Cuenta</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in pacientes" :key="p.id">
              <td class="fuerte">
                {{ p.nombre }}
                <span class="nota">· {{ p.email }}</span>
              </td>
              <td>
                <select
                  :value="p.coberturaId ?? ''"
                  :aria-label="`Cobertura de ${p.nombre}`"
                  @change="cambiarCobertura(p, ($event.target as HTMLSelectElement).value)"
                >
                  <option value="">Particular (sin cobertura)</option>
                  <option v-for="c in coberturas" :key="c.Id" :value="c.Id">
                    {{ c.Nombre }}{{ c.CopagoFijo ? ` · copago ${pesos(c.CopagoFijo)}` : '' }}
                  </option>
                </select>
              </td>
              <td>
                <button
                  v-if="p.cuentaAbiertaId"
                  class="btn btn-secundario btn-chico"
                  @click="verCuenta(p.cuentaAbiertaId)"
                >
                  Ver cuenta #{{ p.cuentaAbiertaId }}
                </button>
                <button v-else class="btn btn-accion" @click="abrirCuenta(p)">Abrir cuenta</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Cuentas -->
    <section class="tarjeta">
      <h2>Cuentas de estadía ({{ cuentas.length }})</h2>
      <p v-if="!cuentas.length" class="nota">Todavía no hay cuentas.</p>
      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>#</th>
              <th>Paciente</th>
              <th>Estado</th>
              <th>Paciente abona</th>
              <th>Terceros</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in cuentas"
              :key="c.Id"
              :class="{ 'fila-elegida': detalle?.Id === c.Id }"
            >
              <td class="fuerte">{{ c.Id }}</td>
              <td>{{ c.pacienteNombre }}</td>
              <td>
                <span :class="['badge', c.Estado === 'Abierta' ? 'verde' : 'gris']">{{ c.Estado }}</span>
              </td>
              <td>{{ pesos(c.TotalCargoPaciente) }}</td>
              <td>{{ pesos(c.TotalCargoTerceros) }}</td>
              <td>
                <button class="btn btn-secundario btn-chico" @click="verCuenta(c.Id)">Ver</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Detalle de la cuenta elegida -->
    <section v-if="detalle" class="tarjeta">
      <h2 class="titulo-con-accion">
        Cuenta #{{ detalle.Id }} · {{ detalle.pacienteNombre }}
        <span class="acciones-titulo">
          <span class="nota">{{ detalle.cobertura.nombre }}</span>
          <button
            v-if="detalle.Estado === 'Abierta'"
            class="btn btn-secundario btn-chico"
            @click="cerrarCuenta"
          >
            Cerrar cuenta
          </button>
          <span v-else class="badge gris">{{ detalle.Estado }}</span>
        </span>
      </h2>

      <div class="totales">
        <div>
          <span class="nota">Paciente abona</span>
          <strong>{{ pesos(detalle.TotalCargoPaciente) }}</strong>
        </div>
        <div>
          <span class="nota">Facturado a terceros</span>
          <strong>{{ pesos(detalle.TotalCargoTerceros) }}</strong>
        </div>
      </div>

      <!-- HU 1.1 -->
      <form
        v-if="detalle.Estado === 'Abierta'"
        class="form bloque"
        @submit.prevent="facturarPrestacion"
      >
        <h3>Facturar prestación</h3>
        <div class="fila">
          <label>
            Concepto
            <input v-model="formPrestacion.concepto" required minlength="3" maxlength="200" />
          </label>
          <label>
            Valor base (nomenclador)
            <input v-model.number="formPrestacion.costoBase" type="number" min="1" step="0.01" required />
          </label>
        </div>
        <div class="fila-final">
          <button class="btn btn-primario" :disabled="enviando">Facturar</button>
        </div>
      </form>

      <!-- HU 2.1 (solo admin: simula a Enfermería) -->
      <form
        v-if="esAdmin && detalle.Estado === 'Abierta'"
        class="form bloque"
        @submit.prevent="simularMedicacion"
      >
        <h3>Simular medicación administrada</h3>
        <p class="nota">
          Emite el evento que enviará Enfermería. Facturación lo escucha y agrega el cargo solo.
        </p>
        <div class="fila">
          <label>
            Insumo
            <select v-model="formInsumo.insumo" required>
              <option v-for="pr in precios" :key="pr.Id" :value="pr.Insumo">
                {{ pr.Insumo }} · {{ pesos(pr.PrecioUnitario) }}
              </option>
            </select>
          </label>
          <label>
            Cantidad
            <input v-model.number="formInsumo.cantidad" type="number" min="1" max="100" required />
          </label>
        </div>
        <div class="fila-final">
          <button class="btn btn-primario" :disabled="enviando">Emitir evento</button>
        </div>
      </form>

      <h3>Cargos</h3>
      <p v-if="!detalle.cargos.length" class="nota">La cuenta no tiene cargos.</p>
      <div v-else class="tabla-wrap">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Concepto</th>
              <th>A nombre de</th>
              <th>Monto</th>
              <th>Evento</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cargo in detalle.cargos" :key="cargo.Id">
              <td>{{ fecha(cargo.FechaCargo) }}</td>
              <td class="motivo">
                {{ cargo.Concepto }}
                <span v-if="cargo.Detalle" class="nota">· {{ cargo.Detalle }}</span>
              </td>
              <td>{{ DESTINATARIOS[cargo.Destinatario] }}</td>
              <td class="fuerte">{{ pesos(cargo.Monto) }}</td>
              <td>
                <code v-if="cargo.ReferenciaEventoId" :title="cargo.ReferenciaEventoId">
                  {{ cargo.ReferenciaEventoId.slice(0, 8) }}
                </code>
                <span v-else class="nota">manual</span>
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

h3 {
  margin: 0 0 12px;
  font-size: 0.95rem;
  font-weight: 700;
}

.titulo-con-accion {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

/* Totales de la cuenta */
.totales {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}

.totales > div {
  flex: 1 1 200px;
  display: flex;
  flex-direction: column;
  padding: 14px 16px;
  border: 1px solid var(--borde);
  border-radius: 8px;
  background: #f8fafc;
}

.totales strong {
  font-size: 1.35rem;
}

.total-general {
  border-color: var(--azul) !important;
  background: #eaf4fb !important;
}

/* Formularios */
.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bloque {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--borde);
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

input,
select {
  padding: 10px 12px;
  border: 1px solid var(--borde);
  border-radius: 6px;
  background: #fff;
  font: inherit;
  font-weight: 400;
  color: var(--texto);
}

.tabla select {
  padding: 6px 10px;
  font-size: 0.85rem;
}

input:focus-visible,
select:focus-visible,
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

.btn-chico {
  padding: 5px 12px;
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
  font-weight: 400;
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

.fila-elegida td {
  background: #eaf4fb;
}

.fuerte {
  font-weight: 700;
}

.badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
}

.verde {
  background: #dcfce7;
  color: #15803d;
}

.gris {
  background: #f1f5f9;
  color: #475569;
}

.acciones-titulo {
  display: flex;
  align-items: center;
  gap: 12px;
}

code {
  font-size: 0.8rem;
  color: var(--suave);
}

@media (max-width: 600px) {
  .encabezado,
  .titulo-con-accion {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>