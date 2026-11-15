import { ConflictException } from '@nestjs/common';
import { ESTADOS, EstadoTurno } from './estados-turnos.js';
import { puedeCambiarA } from './permisos-estados.js';
import { Rol } from '../../iam/rol.enum.js';

// Patrón State - Módulo de Admisión, Épica 2
describe('Máquina de estados del turno (HU 2.1)', () => {
  it('Escenario 1 - Confirmado puede pasar a "En Sala de Espera"', () => {
    const nuevo = ESTADOS[EstadoTurno.CONFIRMADO]!.transicionar(EstadoTurno.ENSALADEESPERA);
    expect(nuevo.nombre).toBe(EstadoTurno.ENSALADEESPERA);
  });

  it('Escenario 2 - Un turno Cancelado no puede pasar a "Atendido"', () => {
    const cancelado = ESTADOS[EstadoTurno.CANCELADO]!;
    expect(() => cancelado.transicionar(EstadoTurno.ATENDIDO)).toThrow(ConflictException);
    expect(() => cancelado.transicionar(EstadoTurno.ATENDIDO)).toThrow(
      'Un turno cancelado no puede avanzar en el flujo de atención.',
    );
  });

  it('Recorrido completo: Programado → Confirmado → En Sala de Espera → Atendido', () => {
    let estado = ESTADOS[EstadoTurno.PROGRAMADO]!;
    estado = estado.transicionar(EstadoTurno.CONFIRMADO);
    estado = estado.transicionar(EstadoTurno.ENSALADEESPERA);
    estado = estado.transicionar(EstadoTurno.ATENDIDO);
    expect(estado.nombre).toBe(EstadoTurno.ATENDIDO);
  });

  it('No se puede saltear la llegada: Programado no pasa directo a Atendido', () => {
    expect(() => ESTADOS[EstadoTurno.PROGRAMADO]!.transicionar(EstadoTurno.ATENDIDO)).toThrow(
      ConflictException,
    );
  });

  it('Atendido es un estado final', () => {
    expect(() => ESTADOS[EstadoTurno.ATENDIDO]!.transicionar(EstadoTurno.CANCELADO)).toThrow(
      ConflictException,
    );
  });
});

describe('Permisos por rol sobre los turnos', () => {
  it('La recepción registra la llegada pero no marca "Atendido"', () => {
    expect(puedeCambiarA(Rol.RECEPCIONISTA, EstadoTurno.ENSALADEESPERA)).toBe(true);
    expect(puedeCambiarA(Rol.RECEPCIONISTA, EstadoTurno.ATENDIDO)).toBe(false);
  });

  it('El médico solo marca "Atendido"', () => {
    expect(puedeCambiarA(Rol.MEDICO, EstadoTurno.ATENDIDO)).toBe(true);
    expect(puedeCambiarA(Rol.MEDICO, EstadoTurno.CANCELADO)).toBe(false);
  });
});
