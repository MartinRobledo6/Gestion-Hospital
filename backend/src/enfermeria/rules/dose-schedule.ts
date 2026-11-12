// Reglas de horarios de medicación (HU 1.2). Funciones puras: no tocan la base ni Nest,
// así se pueden probar solas y se reutilizan desde el servicio.

/** Margen permitido alrededor del horario de la dosis: +/- 30 minutos. */
export const DOSE_WINDOW_MINUTES = 30;

const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
/** Tolerancia para considerar que dos horarios son "el mismo" (la base redondea los milisegundos). */
const SLOT_TOLERANCE_MS = 1_000;

export type MedicationStatus = 'Administrada' | 'Omitida';
export type DoseTiming = 'PROXIMA' | 'EN_HORARIO' | 'VENCIDA';

export interface DoseSchedule {
  /** Primera dosis de la indicación; las siguientes son cada `everyHours` horas. */
  firstDoseAt: Date;
  everyHours: number;
}

/** Trunca a minuto. Los horarios se guardan sin segundos para poder compararlos por igualdad. */
export function truncateToMinute(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setSeconds(0, 0);
  return copy;
}

/** Horarios programados dentro de [from, to). Nunca hay dosis anteriores a la primera. */
export function dosesBetween(schedule: DoseSchedule, from: Date, to: Date): Date[] {
  if (!(schedule.everyHours > 0)) return [];
  const step = schedule.everyHours * HOUR_MS;
  const first = schedule.firstDoseAt.getTime();
  const start = Math.max(from.getTime(), first);
  const firstIndex = Math.ceil((start - first) / step);

  const doses: Date[] = [];
  for (let t = first + firstIndex * step; t < to.getTime(); t += step) {
    doses.push(new Date(t));
  }
  return doses;
}

/**
 * Si `at` coincide con una dosis programada, devuelve ese horario exacto; si no, null.
 * Sirve para validar que el frontend no invente horarios.
 */
export function snapToSlot(schedule: DoseSchedule, at: Date): Date | null {
  if (!(schedule.everyHours > 0) || Number.isNaN(at.getTime())) return null;
  const step = schedule.everyHours * HOUR_MS;
  const first = schedule.firstDoseAt.getTime();
  const diff = at.getTime() - first;
  if (diff < -SLOT_TOLERANCE_MS) return null;

  const slot = first + Math.max(0, Math.round(diff / step)) * step;
  return Math.abs(slot - at.getTime()) <= SLOT_TOLERANCE_MS ? new Date(slot) : null;
}

/** Dónde está "ahora" respecto de la ventana de una dosis (los extremos cuentan como dentro). */
export function doseTiming(slot: Date, now: Date, windowMinutes = DOSE_WINDOW_MINUTES): DoseTiming {
  const diff = now.getTime() - slot.getTime();
  const window = windowMinutes * MINUTE_MS;
  if (diff < -window) return 'PROXIMA';
  if (diff > window) return 'VENCIDA';
  return 'EN_HORARIO';
}

/**
 * Regla de negocio de HU 1.2:
 * - "Administrada" solo dentro del margen de +/- 30 minutos.
 * - "Omitida" se puede registrar desde que se abre la ventana (incluso después de que vence).
 * Devuelve el motivo del rechazo, o null si se puede registrar.
 */
export function checkRegistration(status: MedicationStatus, timing: DoseTiming): string | null {
  if (timing === 'PROXIMA') {
    return `Todavía no es el horario de esta dosis: se puede registrar desde ${DOSE_WINDOW_MINUTES} minutos antes.`;
  }
  if (status === 'Administrada' && timing === 'VENCIDA') {
    return `Pasó el margen de ${DOSE_WINDOW_MINUTES} minutos de esta dosis: ya no se puede registrar como administrada.`;
  }
  return null;
}

export function windowOf(slot: Date, windowMinutes = DOSE_WINDOW_MINUTES): { start: Date; end: Date } {
  const window = windowMinutes * MINUTE_MS;
  return { start: new Date(slot.getTime() - window), end: new Date(slot.getTime() + window) };
}
