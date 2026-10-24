export interface TareaProtocolo {
  descripcion: string;
  completada: boolean;
}

export interface ProtocoloPayload {
  pacienteId: number;
  tipoProtocolo: string;
  tareas: TareaProtocolo[];
}

export class ProtocoloBuilder {
  private pacienteId: number;
  private tipoProtocolo: string = '';
  private tareas: TareaProtocolo[] = [];

  constructor(pacienteId: number) {
    this.pacienteId = pacienteId;
  }

  setTipo(tipo: string): this {
    this.tipoProtocolo = tipo;
    return this;
  }

  addTarea(descripcion: string): this {
    this.tareas.push({ descripcion, completada: false });
    return this;
  }

  // Preset 1: Pre-Quirúrgico (HU 2.1 - Escenario 1)
  buildPreQuirurgico(): this {
    return this.setTipo('Ingreso Pre-Quirúrgico')
      .addTarea('Verificar ayuno de 8 horas')
      .addTarea('Colocar vía intravenosa periférica')
      .addTarea('Realizar control de signos vitales cada 2 horas');
  }

  // Preset 2: Infección Respiratoria (HU 2.1 - Escenario 2)
  buildRespiratorio(): this {
    return this.setTipo('Ingreso por Infección Respiratoria')
      .addTarea('Monitoreo de saturación de oxígeno continuo')
      .addTarea('Indicación de aislamiento de contacto y gotas');
  }

  getPayload(): ProtocoloPayload {
    if (!this.tipoProtocolo) {
      throw new Error('Debe especificar el tipo de protocolo');
    }
    return {
      pacienteId: this.pacienteId,
      tipoProtocolo: this.tipoProtocolo,
      tareas: this.tareas
    };
  }
}