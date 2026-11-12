const formateador = new Intl.DateTimeFormat('es-AR', { dateStyle: 'short', timeStyle: 'short' })

/**
 * El backend exige roomNumber (columna NOT NULL). Cuando el paciente no está internado en una
 * habitación sino en el consultorio de enfermería, guardamos este texto como "ubicación".
 */
export const CONSULTORIO = 'Consultorio'

/** Para tablas y listados: "Consultorio" / "Hab 204". En la base se guarda solo el número. */
export function etiquetaUbicacion(roomNumber: string): string {
  return roomNumber === CONSULTORIO ? CONSULTORIO : `Hab ${roomNumber}`
}

/** Para frases: "en el consultorio" / "en la habitación 204". */
export function textoUbicacion(roomNumber: string): string {
  return roomNumber === CONSULTORIO ? 'en el consultorio' : `en la habitación ${roomNumber}`
}

const formateadorHora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' })

/** "14:00" a partir de un ISO. */
export function formatearHora(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? iso : formateadorHora.format(fecha)
}

export function formatearFechaHora(iso: string): string {
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? iso : formateador.format(fecha)
}
