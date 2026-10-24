import { ConflictException } from '@nestjs/common';
import { EstadoCama } from '../entities/cama.entity.js';

export type OperacionCama = 'asignar' | 'liberar' | 'limpiar' | 'bloquear' | 'desbloquear';

// Única fuente de verdad del ciclo de vida de una cama.
// Todo lo que no figure acá es una transición inválida.
const TRANSICIONES: Record<EstadoCama, Partial<Record<OperacionCama, EstadoCama>>> = {
  [EstadoCama.LIBRES]:      { asignar: EstadoCama.OCUPADAS, bloquear: EstadoCama.BLOQUEADAS },
  [EstadoCama.OCUPADAS]:    { liberar: EstadoCama.EN_LIMPIEZA },
  [EstadoCama.EN_LIMPIEZA]: { limpiar: EstadoCama.LIBRES, bloquear: EstadoCama.BLOQUEADAS },
  [EstadoCama.BLOQUEADAS]:  { desbloquear: EstadoCama.LIBRES },
};

export function siguienteEstado(actual: EstadoCama, op: OperacionCama): EstadoCama {
  const destino = TRANSICIONES[actual][op];

  if (!destino) {
    if (op === 'asignar' && actual === EstadoCama.OCUPADAS) {
      throw new ConflictException('La cama acaba de ser ocupada.');
    }
    throw new ConflictException(`No se puede ${op} una cama que está "${actual}".`);
  }

  return destino;
}