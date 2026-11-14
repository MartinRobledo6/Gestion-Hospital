// Reglas de signos vitales (HU 1.1). Funciones puras.

/** Por encima de esta temperatura (°C) el control se guarda como alerta crítica. */
export const CRITICAL_TEMPERATURE = 39;

export function isCriticalTemperature(temperature: number): boolean {
  return temperature > CRITICAL_TEMPERATURE;
}

/** Nota de enfermería automática que se guarda junto al control. */
export function buildNursingNote(temperature: number, critical: boolean): string {
  return critical
    ? `Alerta: temperatura de ${temperature} °C (supera ${CRITICAL_TEMPERATURE} °C). Se notificó al médico de guardia.`
    : 'Controles de signos vitales realizados con éxito.';
}

/** Texto de la notificación de alta prioridad para el médico de guardia. */
export function buildCriticalMessage(temperature: number, patientId: string, roomNumber: string): string {
  return `Paciente ${patientId} (${roomNumber}): temperatura de ${temperature} °C, supera ${CRITICAL_TEMPERATURE} °C.`;
}
