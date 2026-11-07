import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import { enfermeriaApi } from './enfermeriaApi'
import { textoUbicacion } from './formato'
import type {
  AdmissionReason,
  AdmitPatient,
  CreateIndication,
  CreateMedicationAdministration,
  CreateSupply,
  CreateVitalSigns,
  MedicationAdministration,
  Notificacion,
  Protocol,
  ScheduleItem,
  Supply,
  VitalSigns,
} from './types'

export interface EnfermeroSesion {
  id: number
  nombre: string
}

export type Aviso = { tipo: 'exito' | 'alerta' | 'error'; texto: string }

// Todavía no hay login (el módulo IAM no existe). Guardamos "quién está de turno"
// en localStorage para no pedirlo en cada formulario.
function leerLocal<T>(clave: string, porDefecto: T): T {
  try {
    const raw = localStorage.getItem(clave)
    return raw ? (JSON.parse(raw) as T) : porDefecto
  } catch {
    return porDefecto
  }
}

function guardarLocal(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
  } catch {
    // Sin storage (modo privado, etc.): la app sigue funcionando, solo no recuerda.
  }
}

export const useEnfermeriaStore = defineStore('enfermeria', () => {
  const signosVitales = ref<VitalSigns[]>([])
  const administraciones = ref<MedicationAdministration[]>([])
  const cronograma = ref<ScheduleItem[]>([])
  const inventario = ref<Supply[]>([])
  const notificaciones = ref<Notificacion[]>([])
  const motivosIngreso = ref<AdmissionReason[]>([])
  const protocolos = ref<Protocol[]>([])

  const cargando = ref(false)
  const errorCarga = ref('')
  const aviso = ref<Aviso | null>(null)

  const enfermero = ref<EnfermeroSesion | null>(leerLocal<EnfermeroSesion | null>('enfermeria:enfermero', null))
  watch(enfermero, (v) => guardarLocal('enfermeria:enfermero', v))

  const sinLeer = computed(() => notificaciones.value.filter((n) => !n.read).length)

  function mensajeDe(e: unknown): string {
    return e instanceof ApiError ? e.message : 'Ocurrió un error inesperado.'
  }

  async function cargarTodo() {
    cargando.value = true
    errorCarga.value = ''
    try {
      // Son listas independientes: las pedimos en paralelo.
      const [signos, admins, plan, insumos, notifs, motivos, prots] = await Promise.all([
        enfermeriaApi.listarSignosVitales(),
        enfermeriaApi.listarAdministraciones(),
        enfermeriaApi.obtenerDosisDeHoy(),
        enfermeriaApi.listarInventario(),
        enfermeriaApi.listarNotificaciones(),
        enfermeriaApi.listarMotivosIngreso(),
        enfermeriaApi.listarProtocolos(),
      ])
      signosVitales.value = signos
      administraciones.value = admins
      cronograma.value = plan
      inventario.value = insumos
      notificaciones.value = notifs
      motivosIngreso.value = motivos
      protocolos.value = prots
    } catch (e) {
      errorCarga.value = mensajeDe(e)
    } finally {
      cargando.value = false
    }
  }

  /** Refresco liviano para el "polling": solo lo que cambia solo (avisos y dosis). */
  async function refrescarAvisos() {
    try {
      notificaciones.value = await enfermeriaApi.listarNotificaciones()
    } catch {
      // Un fallo puntual de red no debe llenar la pantalla de errores.
    }
  }

  async function refrescarMedicacion() {
    const [plan, admins, insumos] = await Promise.all([
      enfermeriaApi.obtenerDosisDeHoy(),
      enfermeriaApi.listarAdministraciones(),
      enfermeriaApi.listarInventario(),
    ])
    cronograma.value = plan
    administraciones.value = admins
    inventario.value = insumos
  }

  // ---------- Signos vitales ----------

  async function registrarSignosVitales(dto: CreateVitalSigns): Promise<boolean> {
    try {
      const guardado = await enfermeriaApi.registrarSignosVitales(dto)
      const [lista, notifs] = await Promise.all([
        enfermeriaApi.listarSignosVitales(),
        enfermeriaApi.listarNotificaciones(),
      ])
      signosVitales.value = lista
      notificaciones.value = notifs
      aviso.value = guardado.isCriticalAlert
        ? {
            tipo: 'alerta',
            texto: `Alerta de alta prioridad: ${guardado.temperature} °C ${textoUbicacion(guardado.roomNumber)}. Se notificó al médico de guardia.`,
          }
        : {
            tipo: 'exito',
            texto: `Controles de ${guardado.patientId} registrados. Nota de enfermería: ${guardado.nursingNote ?? 'controles realizados'}.`,
          }
      return true
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
      return false
    }
  }

  // ---------- Avisos ----------

  async function marcarLeida(id: number) {
    try {
      await enfermeriaApi.marcarNotificacionLeida(id)
      notificaciones.value = await enfermeriaApi.listarNotificaciones()
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
    }
  }

  // ---------- Medicación ----------

  async function registrarAdministracion(dto: CreateMedicationAdministration): Promise<boolean> {
    try {
      const guardado = await enfermeriaApi.registrarAdministracion(dto)
      await refrescarMedicacion()
      aviso.value = {
        tipo: 'exito',
        texto:
          guardado.status === 'Administrada'
            ? `Dosis registrada. Se descontó una unidad del inventario.`
            : `Dosis registrada como omitida.`,
      }
      return true
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
      // Si falló por estado desactualizado (dosis ya registrada, stock), mostramos lo real.
      try {
        await refrescarMedicacion()
      } catch {
        /* se conserva el aviso original */
      }
      return false
    }
  }

  async function crearInsumo(dto: CreateSupply): Promise<boolean> {
    try {
      await enfermeriaApi.crearInsumo(dto)
      inventario.value = await enfermeriaApi.listarInventario()
      aviso.value = { tipo: 'exito', texto: `Insumo "${dto.name}" cargado al inventario.` }
      return true
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
      return false
    }
  }

  async function crearIndicacion(dto: CreateIndication): Promise<boolean> {
    try {
      await enfermeriaApi.crearIndicacion(dto)
      cronograma.value = await enfermeriaApi.obtenerDosisDeHoy()
      aviso.value = { tipo: 'exito', texto: `Indicación de ${dto.medication} creada para ${dto.patientName}.` }
      return true
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
      return false
    }
  }

  // ---------- Protocolos ----------

  async function admitirPaciente(dto: AdmitPatient): Promise<boolean> {
    try {
      const protocolo = await enfermeriaApi.admitirPaciente(dto)
      protocolos.value = await enfermeriaApi.listarProtocolos()
      aviso.value = {
        tipo: 'exito',
        texto: `Se generó "${protocolo.type}" con ${protocolo.tasks.length} tareas.`,
      }
      return true
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
      return false
    }
  }

  async function marcarTarea(id: number, completed: boolean) {
    try {
      await enfermeriaApi.marcarTarea(id, completed)
      protocolos.value = await enfermeriaApi.listarProtocolos()
    } catch (e) {
      aviso.value = { tipo: 'error', texto: mensajeDe(e) }
    }
  }

  function limpiarAviso() {
    aviso.value = null
  }

  return {
    signosVitales,
    administraciones,
    cronograma,
    inventario,
    notificaciones,
    motivosIngreso,
    protocolos,
    cargando,
    errorCarga,
    aviso,
    enfermero,
    sinLeer,
    cargarTodo,
    refrescarAvisos,
    refrescarMedicacion,
    registrarSignosVitales,
    marcarLeida,
    registrarAdministracion,
    crearInsumo,
    crearIndicacion,
    admitirPaciente,
    marcarTarea,
    limpiarAviso,
  }
})
