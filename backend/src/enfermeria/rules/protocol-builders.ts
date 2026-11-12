// Patrón Builder para los protocolos de ingreso (HU 2.1, Épica 2).
//
// - ProtocolBuilder: la interfaz con los pasos para armar un plan de cuidados.
// - PreOpProtocolBuilder / RespiratoryProtocolBuilder: builders concretos, cada uno sabe
//   qué tareas lleva su tipo de ingreso.
// - ProtocolDirector: decide el orden de los pasos, sin conocer qué builder usa.
//
// Para sumar un tipo de ingreso nuevo (p. ej. traumatismo) se crea otro builder y se lo
// registra en ADMISSION_REASONS; nada de lo existente se modifica.

export interface ProtocolPlan {
  type: string;
  tasks: string[];
}

export interface ProtocolBuilder {
  reset(): this;
  setType(): this;
  addTasks(): this;
  getPlan(): ProtocolPlan;
}

abstract class BaseProtocolBuilder implements ProtocolBuilder {
  protected type = '';
  protected tasks: string[] = [];

  protected abstract readonly typeName: string;
  protected abstract readonly taskList: readonly string[];

  reset(): this {
    this.type = '';
    this.tasks = [];
    return this;
  }

  setType(): this {
    this.type = this.typeName;
    return this;
  }

  addTasks(): this {
    this.tasks.push(...this.taskList);
    return this;
  }

  getPlan(): ProtocolPlan {
    if (!this.type) throw new Error('El protocolo no tiene tipo: falta llamar a setType().');
    return { type: this.type, tasks: [...this.tasks] };
  }
}

/** Escenario 1: ingreso pre-quirúrgico. */
export class PreOpProtocolBuilder extends BaseProtocolBuilder {
  protected readonly typeName = 'Ingreso Pre-Quirúrgico';
  protected readonly taskList = [
    'Verificar ayuno de 8 horas',
    'Colocar vía intravenosa periférica',
    'Realizar control de signos vitales cada 2 horas',
  ] as const;
}

/** Escenario 2: ingreso por infección respiratoria (p. ej. neumonía). */
export class RespiratoryProtocolBuilder extends BaseProtocolBuilder {
  protected readonly typeName = 'Ingreso por Infección Respiratoria';
  protected readonly taskList = [
    'Monitoreo de saturación de oxígeno continuo',
    'Indicación de aislamiento de contacto y gotas',
  ] as const;
}

export class ProtocolDirector {
  constructor(private readonly builder: ProtocolBuilder) {}

  build(): ProtocolPlan {
    return this.builder.reset().setType().addTasks().getPlan();
  }
}

// ---- Motivos de ingreso disponibles ----

export const ADMISSION_REASONS = [
  { value: 'PRE_QUIRURGICO', label: 'Cirugía programada', create: () => new PreOpProtocolBuilder() },
  { value: 'INFECCION_RESPIRATORIA', label: 'Infección respiratoria (neumonía)', create: () => new RespiratoryProtocolBuilder() },
] as const;

export type AdmissionReason = (typeof ADMISSION_REASONS)[number]['value'];

export const ADMISSION_REASON_VALUES: string[] = ADMISSION_REASONS.map((r) => r.value);

export function buildProtocolFor(reason: string): ProtocolPlan {
  const entry = ADMISSION_REASONS.find((r) => r.value === reason);
  if (!entry) throw new Error(`Motivo de ingreso desconocido: ${reason}`);
  return new ProtocolDirector(entry.create()).build();
}
