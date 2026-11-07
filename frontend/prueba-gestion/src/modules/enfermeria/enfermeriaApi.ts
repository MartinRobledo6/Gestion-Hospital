import { http } from '@/api/http'
import type {
  AdmissionReason,
  AdmitPatient,
  CreateIndication,
  CreateMedicationAdministration,
  CreateSupply,
  CreateVitalSigns,
  Indication,
  MedicationAdministration,
  Notificacion,
  Protocol,
  ProtocolTask,
  ScheduleItem,
  Supply,
  VitalSigns,
} from './types'

const json = (body: unknown): RequestInit => ({ body: JSON.stringify(body) })

// Una función por endpoint del backend (backend/src/enfermeria/*.controller.ts).
// Sin lógica de pantalla acá.
export const enfermeriaApi = {
  // --- Signos vitales ---
  listarSignosVitales: () => http<VitalSigns[]>('/enfermeria/vital-signs'),
  registrarSignosVitales: (dto: CreateVitalSigns) =>
    http<VitalSigns>('/enfermeria/vital-signs', { method: 'POST', ...json(dto) }),

  // --- Avisos al médico de guardia ---
  listarNotificaciones: () => http<Notificacion[]>('/enfermeria/notifications'),
  marcarNotificacionLeida: (id: number) =>
    http<Notificacion>(`/enfermeria/notifications/${id}/read`, { method: 'PATCH' }),

  // --- Medicación ---
  obtenerDosisDeHoy: () => http<ScheduleItem[]>('/enfermeria/medication-schedule'),
  listarAdministraciones: () =>
    http<MedicationAdministration[]>('/enfermeria/medication-administration'),
  registrarAdministracion: (dto: CreateMedicationAdministration) =>
    http<MedicationAdministration>('/enfermeria/medication-administration', {
      method: 'POST',
      ...json(dto),
    }),

  // --- Inventario e indicaciones (hoy los carga la pantalla de "datos de prueba") ---
  listarInventario: () => http<Supply[]>('/enfermeria/inventory'),
  crearInsumo: (dto: CreateSupply) =>
    http<Supply>('/enfermeria/inventory', { method: 'POST', ...json(dto) }),
  crearIndicacion: (dto: CreateIndication) =>
    http<Indication>('/enfermeria/indications', { method: 'POST', ...json(dto) }),

  // --- Protocolos de ingreso ---
  listarMotivosIngreso: () => http<AdmissionReason[]>('/enfermeria/protocols/reasons'),
  listarProtocolos: () => http<Protocol[]>('/enfermeria/protocols'),
  admitirPaciente: (dto: AdmitPatient) =>
    http<Protocol>('/enfermeria/protocols', { method: 'POST', ...json(dto) }),
  marcarTarea: (id: number, completed: boolean) =>
    http<ProtocolTask>(`/enfermeria/protocols/tasks/${id}`, { method: 'PATCH', ...json({ completed }) }),
}
