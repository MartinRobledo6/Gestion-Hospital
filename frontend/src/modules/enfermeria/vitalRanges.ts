export type Nivel = 'ok' | 'warn' | 'critical'

export type CampoVital = 'systolic' | 'diastolic' | 'heartRate' | 'temperature'

interface Rango {
  etiqueta: string
  unidad: string
  /** Límites de lo que tiene sentido ingresar (detecta errores de tipeo, no diagnostica). */
  min: number
  max: number
  /** Rango normal de referencia para adultos. Fuera de acá: se marca en ámbar. */
  normalMin: number
  normalMax: number
}

export const RANGOS: Record<CampoVital, Rango> = {
  systolic: { etiqueta: 'Presión sistólica', unidad: 'mmHg', min: 50, max: 260, normalMin: 90, normalMax: 140 },
  diastolic: { etiqueta: 'Presión diastólica', unidad: 'mmHg', min: 30, max: 160, normalMin: 60, normalMax: 90 },
  heartRate: { etiqueta: 'Frecuencia cardíaca', unidad: 'lpm', min: 20, max: 250, normalMin: 60, normalMax: 100 },
  temperature: { etiqueta: 'Temperatura', unidad: '°C', min: 30, max: 45, normalMin: 36, normalMax: 37.9 },
}

/** Mismo umbral que usa el backend para isCriticalAlert (HU 1.1, escenario 2). */
export const TEMPERATURA_CRITICA = 39

export function evaluar(campo: CampoVital, valor: number): Nivel {
  if (campo === 'temperature' && valor > TEMPERATURA_CRITICA) return 'critical'
  const r = RANGOS[campo]
  return valor < r.normalMin || valor > r.normalMax ? 'warn' : 'ok'
}
