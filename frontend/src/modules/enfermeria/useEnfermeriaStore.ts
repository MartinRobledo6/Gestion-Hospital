import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { ApiError } from '@/api/http'
import { enfermeriaApi } from './enfermeriaApi'
import { useAuthStore } from '@/stores/auth'
import { tieneRol } from '@/permisos'
import { textoUbicacion } from './formato'
import type {
  AdmissionReason,
  AdmitPatient,
  CreateIndication,
  CreateMedicationAdministration,
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

  // Quién está de turno sale del login (antes se escribía a mano en NurseSession).
  // Solo enfermería (o el admin) registra controles, dosis y protocolos.
  const auth = useAuthStore()
  const enfermero = computed<EnfermeroSesion | null>(() =>
    auth.usuario && tieneRol(auth.rol, 'ENFERMERO')
      ? { id: auth.usuario.id, nombre: auth.usuario.nombre }
      : null,
  )
  // Solo el médico (o el admin) carga indicaciones
  const puedeIndicar = computed(() => tieneRol(auth.rol, 'MEDICO'))

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


  async function crearIndicacion(dto: CreateIndication): Promise<boolean> {
  try {
    const creada = await enfermeriaApi.crearIndicacion(dto)
    cronograma.value = await enfermeriaApi.obtenerDosisDeHoy()

    aviso.value = {
      tipo: 'exito',
            texto: `Indicación del Dr./Dra. ${creada.medicoName} creada para ${creada.patientName}: ${creada.medication}.`,
    }

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
    puedeIndicar,
    sinLeer,
    cargarTodo,
    refrescarAvisos,
    refrescarMedicacion,
    registrarSignosVitales,
    marcarLeida,
    registrarAdministracion,
    crearIndicacion,
    admitirPaciente,
    marcarTarea,
    limpiarAviso,
  }
})
