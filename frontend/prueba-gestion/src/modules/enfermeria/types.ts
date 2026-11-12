// Tipos espejo de las entidades y DTOs del backend (backend/src/enfermeria).
// Si cambiás un campo allá, cambialo acá: TypeScript no los conecta solo.

// ---------- Signos vitales (HU 1.1) ----------

/** vital-signs.entity.ts */
export interface VitalSigns {
  id: string
  patientId: string
  nurseName: string
  roomNumber: string
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  temperature: number
  isCriticalAlert: boolean // el backend la calcula: temperatura > 39
  nursingNote: string | null // nota de enfermería automática, la genera el backend
  recordedAt: string // ISO, lo pone la base de datos
}

/** create-vital-signs.dto.ts: lo que enviamos (el resto lo genera el backend) */
export type CreateVitalSigns = Omit<
  VitalSigns,
  'id' | 'isCriticalAlert' | 'nursingNote' | 'recordedAt'
>

// ---------- Medicación (HU 1.2) ----------

export type MedicationStatus = 'Administrada' | 'Omitida'

/** medication-administration.entity.ts */
export interface MedicationAdministration {
  id: number
  indicationId: number
  nurseId: number
  administeredAt: string
  scheduledAt: string | null
  status: MedicationStatus
}

/** create-medication-administration.dto.ts */
export interface CreateMedicationAdministration {
  indicationId: number
  nurseId: number
  status: MedicationStatus
  scheduledAt: string // horario de la dosis que se confirma (viene de /medication-schedule)
}

/** inventario-insumo.entity.ts */
export interface Supply {
  id: number
  name: string
  stock: number
}
export type CreateSupply = Omit<Supply, 'id'>

/** indicacion-medica.entity.ts */
export interface Indication {
  id: number
  patientId: string
  patientName: string
  medication: string
  dose: string
  everyHours: number
  firstDoseAt: string
  supplyId: number
  active: boolean
  createdAt: string
}
export type CreateIndication = Omit<Indication, 'id' | 'active' | 'createdAt'>

/** Una dosis programada del día, con su estado (GET /medication-schedule). */
export interface Dose {
  scheduledAt: string
  windowStart: string // desde cuándo se puede registrar (horario - 30 min)
  windowEnd: string // hasta cuándo se puede marcar como administrada (horario + 30 min)
  status: 'Pendiente' | 'Administrada' | 'Omitida'
  administeredAt: string | null
  nurseId: number | null
}

export interface ScheduleItem {
  indication: Indication
  supply: { id: number; name: string; stock: number } | null
  doses: Dose[]
}

// ---------- Avisos al médico de guardia (HU 1.1, escenario 2) ----------

/** notificacion.entity.ts */
export interface Notificacion {
  id: number
  priority: string
  recipientRole: string
  message: string
  referenceId: string | null
  read: boolean
  createdAt: string
}

// ---------- Protocolos de ingreso (HU 2.1) ----------

export interface AdmissionReason {
  value: string
  label: string
  type: string
  tasks: string[] // las tareas que generaría el protocolo (vista previa)
}

export interface ProtocolTask {
  id: number
  description: string
  completed: boolean
}

export interface Protocol {
  id: number
  patientId: string
  roomNumber: string
  type: string
  startedAt: string
  tasks: ProtocolTask[]
}

/** admit-patient.dto.ts: el "evento de ingreso" que en el sistema final enviaría Admisión */
export interface AdmitPatient {
  patientId: string
  roomNumber: string
  reason: string
}
