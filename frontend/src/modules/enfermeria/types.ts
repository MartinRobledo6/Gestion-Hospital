// Tipos espejo de las entidades y DTOs del backend (backend/src/enfermeria).
// Si cambiás un campo allá, cambialo acá: TypeScript no los conecta solo.

// ---------- Signos vitales (HU 1.1) ----------


// ---------- Signos vitales ----------

export interface VitalSigns {
  id: string
  patientId: number
  nurseName: string
  roomNumber: string
  bloodPressureSystolic: number
  bloodPressureDiastolic: number
  heartRate: number
  temperature: number
  isCriticalAlert: boolean
  nursingNote: string | null
  recordedAt: string
}

export type CreateVitalSigns = Omit<
  VitalSigns,
  'id' | 'isCriticalAlert' | 'nursingNote' | 'recordedAt'
>

// ---------- Medicación ----------

export type MedicationStatus = 'Administrada' | 'Omitida'

export interface MedicationAdministration {
  id: number
  indicationId: number
  nurseId: number
  nurseName: string | null
  administeredAt: string
  scheduledAt: string | null
  status: MedicationStatus
}

export interface CreateMedicationAdministration {
  indicationId: number
  nurseId: number
  status: MedicationStatus
  scheduledAt: string
}

export interface Supply {
  id: number
  name: string
  stock: number
}

export interface Indication {
  id: number
  patientId: number
  medicoId: number
  supplyId: number
  patientName: string
  medication: string
  dose: string
  frequency: string
  firstDoseAt: string
  active: boolean
  createdAt: string
  medicoName?: string
}

export interface CreateIndication {
  patientId: number
  medicoId: number
  supplyId: number
  dose: string
  everyHours: number
  firstDoseAt: string
}

export interface Dose {
  scheduledAt: string
  windowStart: string
  windowEnd: string
  status: 'Pendiente' | 'Administrada' | 'Omitida'
  administeredAt: string | null
  nurseId: number | null
}

export interface ScheduleItem {
  indication: Indication
  supply: Supply | null
  doses: Dose[]
}

// ---------- Notificaciones ----------

export interface Notificacion {
  id: number
  priority: string
  recipientRole: string
  message: string
  referenceId: string | null
  read: boolean
  createdAt: string
}

// ---------- Protocolos ----------

export interface AdmissionReason {
  value: string
  label: string
  type: string
  tasks: string[]
}

export interface ProtocolTask {
  id: number
  description: string
  completed: boolean
}

export interface Protocol {
  id: number
  patientId: number
  roomNumber: string
  type: string
  startedAt: string
  tasks: ProtocolTask[]
}

export interface AdmitPatient {
  patientId: number
  roomNumber: string
  reason: string
}
