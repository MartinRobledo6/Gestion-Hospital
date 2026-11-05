import { ConflictException } from '@nestjs/common';

export enum EstadoTurno {
  PROGRAMADO = 'Programado',
  CONFIRMADO = 'Confirmado',
  ENSALADEESPERA = 'En Sala de Espera',
  ATENDIDO = 'Atendido',
  CANCELADO = 'Cancelado',
}

export const EstadosTurnos = [
  EstadoTurno.PROGRAMADO,
  EstadoTurno.CONFIRMADO,
  EstadoTurno.ENSALADEESPERA,
  EstadoTurno.ATENDIDO,
  EstadoTurno.CANCELADO,
];

export interface IEstadoTurno {
  nombre: EstadoTurno;
  transicionar(destino: string): IEstadoTurno;
}

// Flujo: Programado -> Confirmado -> En Sala de Espera -> Atendido
// - Confirmado: el paciente revalida que va a asistir (antes de llegar).
// - Atajo: Programado -> En Sala de Espera, si llega sin haber confirmado.
// - Se puede cancelar desde Programado, Confirmado o En Sala de Espera.

export class ProgramadoState implements IEstadoTurno {
  nombre = EstadoTurno.PROGRAMADO;

  transicionar(destino: string): IEstadoTurno {
    if (destino === EstadoTurno.CONFIRMADO) return ESTADOS[EstadoTurno.CONFIRMADO];
    if (destino === EstadoTurno.ENSALADEESPERA) return ESTADOS[EstadoTurno.ENSALADEESPERA];
    if (destino === EstadoTurno.CANCELADO) return ESTADOS[EstadoTurno.CANCELADO];

    throw new ConflictException(
      `No se puede pasar un turno de "${this.nombre}" a "${destino}".`,
    );
  }
}

export class ConfirmadoState implements IEstadoTurno {
  nombre = EstadoTurno.CONFIRMADO;

  transicionar(destino: string): IEstadoTurno {
    if (destino === EstadoTurno.ENSALADEESPERA) return ESTADOS[EstadoTurno.ENSALADEESPERA];
    if (destino === EstadoTurno.CANCELADO) return ESTADOS[EstadoTurno.CANCELADO];

    throw new ConflictException(
      `No se puede pasar un turno de "${this.nombre}" a "${destino}".`,
    );
  }
}

export class EnSalaDeEsperaState implements IEstadoTurno {
  nombre = EstadoTurno.ENSALADEESPERA;

  transicionar(destino: string): IEstadoTurno {
    if (destino === EstadoTurno.ATENDIDO) return ESTADOS[EstadoTurno.ATENDIDO];
    if (destino === EstadoTurno.CANCELADO) return ESTADOS[EstadoTurno.CANCELADO];

    throw new ConflictException(
      `No se puede pasar un turno de "${this.nombre}" a "${destino}".`,
    );
  }
}

export class AtendidoState implements IEstadoTurno {
  nombre = EstadoTurno.ATENDIDO;

  transicionar(destino: string): IEstadoTurno {
    throw new ConflictException(
      `El turno ya fue atendido: no se puede pasar a "${destino}".`,
    );
  }
}

export class CanceladoState implements IEstadoTurno {
  nombre = EstadoTurno.CANCELADO;

  transicionar(destino: string): IEstadoTurno {
    throw new ConflictException(
      'Un turno cancelado no puede avanzar en el flujo de atención.',
    );
  }
}

export const ESTADOS: Record<string, IEstadoTurno> = {
  [EstadoTurno.CONFIRMADO]: new ConfirmadoState(),
  [EstadoTurno.PROGRAMADO]: new ProgramadoState(),
  [EstadoTurno.ENSALADEESPERA]: new EnSalaDeEsperaState(),
  [EstadoTurno.ATENDIDO]: new AtendidoState(),
  [EstadoTurno.CANCELADO]: new CanceladoState(),
};