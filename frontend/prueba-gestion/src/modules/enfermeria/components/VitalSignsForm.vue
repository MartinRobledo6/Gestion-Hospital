<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useEnfermeriaStore } from '../useEnfermeriaStore'
import { RANGOS, TEMPERATURA_CRITICA, evaluar, type CampoVital } from '../vitalRanges'
import { CONSULTORIO } from '../formato'

const store = useEnfermeriaStore()

// Dónde está el paciente: el casillero de habitación solo se pide si está internado en una.
const ubicacion = ref<'habitacion' | 'consultorio'>('habitacion')

// Ojo: Vue convierte a número el v-model de un <input type="number"> (y deja '' si está vacío).
// Por eso estos campos son string | number, y abajo siempre pasamos por String() antes de .trim().
const form = reactive<{
  patientId: string
  roomNumber: string
  systolic: string | number
  diastolic: string | number
  heartRate: string | number
  temperature: string | number
}>({
  patientId: '',
  roomNumber: '',
  systolic: '',
  diastolic: '',
  heartRate: '',
  temperature: '',
})

const errores = reactive<Record<string, string>>({})
const enviando = ref(false)

const CAMPOS_NUMERICOS: CampoVital[] = ['systolic', 'diastolic', 'heartRate', 'temperature']

/** Nivel en vivo de cada campo numérico, para pintar el input mientras se escribe. */
const nivel = computed(() => {
  const out: Partial<Record<CampoVital, 'ok' | 'warn' | 'critical'>> = {}
  for (const c of CAMPOS_NUMERICOS) {
    const raw = String(form[c]).trim()
    if (raw !== '' && Number.isFinite(Number(raw))) out[c] = evaluar(c, Number(raw))
  }
  return out
})

function validar(): boolean {
  for (const k of Object.keys(errores)) delete errores[k]

  if (!form.patientId.trim()) errores.patientId = 'Ingresá el ID del paciente.'
  if (ubicacion.value === 'habitacion' && !form.roomNumber.trim()) {
    errores.roomNumber = 'Ingresá la habitación.'
  }
  if (!store.enfermero) errores.nurse = 'Iniciá el turno (arriba) para registrar controles.'

  for (const c of CAMPOS_NUMERICOS) {
    const r = RANGOS[c]
    const n = Number(form[c])
    if (String(form[c]).trim() === '' || !Number.isFinite(n)) {
      errores[c] = `Ingresá ${r.etiqueta.toLowerCase()}.`
    } else if (n < r.min || n > r.max) {
      errores[c] = `Revisá el valor: debe estar entre ${r.min} y ${r.max} ${r.unidad}.`
    }
  }
  if (!errores.systolic && !errores.diastolic && Number(form.systolic) <= Number(form.diastolic)) {
    errores.diastolic = 'La diastólica debe ser menor que la sistólica.'
  }
  return Object.keys(errores).length === 0
}

async function enviar() {
  if (!validar() || !store.enfermero) return
  enviando.value = true
  const ok = await store.registrarSignosVitales({
    patientId: form.patientId.trim(),
    nurseName: store.enfermero.nombre,
    roomNumber: ubicacion.value === 'consultorio' ? CONSULTORIO : form.roomNumber.trim(),
    bloodPressureSystolic: Number(form.systolic),
    bloodPressureDiastolic: Number(form.diastolic),
    heartRate: Number(form.heartRate),
    temperature: Number(form.temperature),
  })
  enviando.value = false
  if (ok) {
    for (const k of Object.keys(form) as (keyof typeof form)[]) form[k] = ''
  }
}
</script>

<template>
  <form class="panel" novalidate @submit.prevent="enviar">
    <div class="panel-head">
      <h2>Registrar controles</h2>
      <p class="hint">Temperatura sobre {{ TEMPERATURA_CRITICA }} °C se guarda como alerta.</p>
    </div>

    <section class="grupo" aria-labelledby="vs-g-paciente">
      <h3 id="vs-g-paciente">Paciente</h3>
      <div class="fila">
        <div class="field">
          <label for="vs-paciente">ID del paciente</label>
          <input id="vs-paciente" v-model="form.patientId" type="text" autocomplete="off" :aria-invalid="!!errores.patientId" />
          <span v-if="errores.patientId" class="field-error">{{ errores.patientId }}</span>
        </div>

        <fieldset class="field">
          <legend>Ubicación</legend>
          <div class="seg-group">
            <label class="seg" :class="{ activo: ubicacion === 'habitacion' }">
              <input v-model="ubicacion" type="radio" name="vs-ubicacion" value="habitacion" />
              Habitación
            </label>
            <label class="seg" :class="{ activo: ubicacion === 'consultorio' }">
              <input v-model="ubicacion" type="radio" name="vs-ubicacion" value="consultorio" />
              Consultorio
            </label>
          </div>
        </fieldset>

        <div v-if="ubicacion === 'habitacion'" class="field">
          <label for="vs-hab">Número de habitación</label>
          <input id="vs-hab" v-model="form.roomNumber" type="text" autocomplete="off" :aria-invalid="!!errores.roomNumber" />
          <span v-if="errores.roomNumber" class="field-error">{{ errores.roomNumber }}</span>
        </div>
      </div>
    </section>

    <section class="grupo" aria-labelledby="vs-g-vitales">
      <h3 id="vs-g-vitales">Signos vitales</h3>
      <div class="fila">
        <div class="field">
          <label for="vs-sis">Presión arterial</label>
          <div class="bp">
            <div class="input-unit">
              <input id="vs-sis" v-model="form.systolic" type="number" inputmode="numeric" step="1" placeholder="Sistólica" aria-label="Presión sistólica (mmHg)" :class="{ 'is-warn': nivel.systolic === 'warn' }" :aria-invalid="!!errores.systolic" />
            </div>
            <span class="barra" aria-hidden="true">/</span>
            <div class="input-unit">
              <input id="vs-dia" v-model="form.diastolic" type="number" inputmode="numeric" step="1" placeholder="Diastólica" aria-label="Presión diastólica (mmHg)" :class="{ 'is-warn': nivel.diastolic === 'warn' }" :aria-invalid="!!errores.diastolic" />
              <span class="unit" aria-hidden="true">mmHg</span>
            </div>
          </div>
          <span v-if="errores.systolic" class="field-error">{{ errores.systolic }}</span>
          <span v-else-if="errores.diastolic" class="field-error">{{ errores.diastolic }}</span>
          <span v-else-if="nivel.systolic === 'warn' || nivel.diastolic === 'warn'" class="field-note is-warn">Fuera del rango habitual ({{ RANGOS.systolic.normalMin }}–{{ RANGOS.systolic.normalMax }} / {{ RANGOS.diastolic.normalMin }}–{{ RANGOS.diastolic.normalMax }}).</span>
        </div>

        <div class="field">
          <label for="vs-fc">Frecuencia cardíaca</label>
          <div class="input-unit">
            <input id="vs-fc" v-model="form.heartRate" type="number" inputmode="numeric" step="1" :class="{ 'is-warn': nivel.heartRate === 'warn' }" :aria-invalid="!!errores.heartRate" />
            <span class="unit" aria-hidden="true">lpm</span>
          </div>
          <span v-if="errores.heartRate" class="field-error">{{ errores.heartRate }}</span>
          <span v-else-if="nivel.heartRate === 'warn'" class="field-note is-warn">Fuera del rango habitual ({{ RANGOS.heartRate.normalMin }}–{{ RANGOS.heartRate.normalMax }}).</span>
        </div>

        <div class="field">
          <label for="vs-temp">Temperatura</label>
          <div class="input-unit">
            <input id="vs-temp" v-model="form.temperature" type="number" inputmode="decimal" step="0.1" :class="{ 'is-warn': nivel.temperature === 'warn', 'is-critical': nivel.temperature === 'critical' }" :aria-invalid="!!errores.temperature" />
            <span class="unit" aria-hidden="true">°C</span>
          </div>
          <span v-if="errores.temperature" class="field-error">{{ errores.temperature }}</span>
          <span v-else-if="nivel.temperature === 'critical'" class="field-note is-critical">Supera {{ TEMPERATURA_CRITICA }} °C: se registra como alerta.</span>
          <span v-else-if="nivel.temperature === 'warn'" class="field-note is-warn">Fuera del rango habitual ({{ RANGOS.temperature.normalMin }}–{{ RANGOS.temperature.normalMax }}).</span>
        </div>
      </div>
    </section>

    <p v-if="errores.nurse" class="field-error" role="alert" style="margin-top: 1rem">{{ errores.nurse }}</p>

    <div class="acciones">
      <p class="hint">
        <template v-if="store.enfermero">Se guarda a nombre de <strong>{{ store.enfermero.nombre }}</strong>.</template>
        <template v-else>Iniciá el turno para poder guardar.</template>
      </p>
      <button type="submit" class="btn" :disabled="enviando">{{ enviando ? 'Guardando…' : 'Guardar controles' }}</button>
    </div>
  </form>
</template>

<style scoped>
fieldset {
  border: 0;
  padding: 0;
  margin: 0;
  min-width: 0;
}

/* Los navegadores le ponen relleno propio a <legend>: lo igualamos a un <label> normal. */
fieldset legend {
  padding: 0;
  margin-bottom: 0.3rem;
}

/* ---------- Bloques del formulario ---------- */

.grupo + .grupo {
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
}

.grupo h3 {
  margin-bottom: 0.75rem;
  color: var(--brand-dark);
}

.fila {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem 1.25rem;
  align-items: start;
}

/* ---------- Selector de ubicación (botones tipo interruptor) ---------- */

.seg-group {
  display: flex;
  border: 1px solid #9fb0ae;
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

.seg {
  position: relative;
  flex: 1;
  padding: 0.55rem 0.7rem;
  text-align: center;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  user-select: none;
}

.seg + .seg {
  border-left: 1px solid #9fb0ae;
}

.seg:hover:not(.activo) {
  background: var(--brand-soft);
}

.seg.activo {
  background: var(--brand);
  color: #fff;
}

/* El radio real queda encima, invisible: sigue siendo accesible con teclado y lector de pantalla. */
.seg input {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}

.seg:has(input:focus-visible) {
  outline: 3px solid var(--brand-dark);
  outline-offset: -3px;
}

/* ---------- Presión arterial y unidades dentro del campo ---------- */

.bp {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bp .input-unit {
  flex: 1;
  min-width: 0;
}

.barra {
  color: var(--muted);
  font-size: 1.25rem;
}

.input-unit {
  position: relative;
}

.field .input-unit input[type='number'] {
  padding-right: 3.4rem;
}

/* La sistólica no lleva unidad (la muestra la diastólica), así que no necesita el relleno extra. */
.field .bp .input-unit:first-child input[type='number'] {
  padding-right: 0.7rem;
}

.unit {
  position: absolute;
  top: 50%;
  right: 0.75rem;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 0.8125rem;
  pointer-events: none;
}

/* ---------- Pie con el botón ---------- */

.acciones {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem 1rem;
  margin-top: 1.5rem;
  padding-top: 1.25rem;
  border-top: 1px solid var(--line);
}

@media (max-width: 760px) {
  .fila {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
