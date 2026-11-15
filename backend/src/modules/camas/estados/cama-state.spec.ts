import { ConflictException } from '@nestjs/common';
import { siguienteEstado } from './cama-state.js';
import { EstadoCama } from '../entities/cama.entity.js';

// Máquina de estados logística - Módulo de Camas, Épica 2
describe('Ciclo de vida de una cama', () => {
  it('HU 1.1 Esc. 1 - Una cama libre se puede asignar y pasa a "ocupadas"', () => {
    expect(siguienteEstado(EstadoCama.LIBRES, 'asignar')).toBe(EstadoCama.OCUPADAS);
  });

  it('HU 1.1 Esc. 2 - Asignar una cama ocupada da error de concurrencia', () => {
    expect(() => siguienteEstado(EstadoCama.OCUPADAS, 'asignar')).toThrow(
      'La cama acaba de ser ocupada.',
    );
  });

  it('HU 2.1 Esc. 1 - El alta pasa la cama a "en limpieza", nunca directo a libre', () => {
    expect(siguienteEstado(EstadoCama.OCUPADAS, 'liberar')).toBe(EstadoCama.EN_LIMPIEZA);
  });

  it('HU 2.1 Esc. 1 - Una cama en limpieza no se puede asignar', () => {
    expect(() => siguienteEstado(EstadoCama.EN_LIMPIEZA, 'asignar')).toThrow(ConflictException);
  });

  it('HU 2.1 Esc. 2 - Maestranza confirma la higiene y la cama vuelve a "libres"', () => {
    expect(siguienteEstado(EstadoCama.EN_LIMPIEZA, 'limpiar')).toBe(EstadoCama.LIBRES);
  });

  it('Una cama bloqueada solo sale de ese estado al desbloquearla', () => {
    expect(() => siguienteEstado(EstadoCama.BLOQUEADAS, 'asignar')).toThrow(ConflictException);
    expect(siguienteEstado(EstadoCama.BLOQUEADAS, 'desbloquear')).toBe(EstadoCama.LIBRES);
  });
});
