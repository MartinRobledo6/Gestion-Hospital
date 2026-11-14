import { Rol } from '../../iam/rol.enum.js';
import { EstadoTurno } from './estados-turnos.js';

// A qué estados puede llevar un turno cada rol.
// El patrón State decide si la transición es válida;
// este mapa decide si el rol tiene permiso para hacerla.
export const ESTADOS_PERMITIDOS_POR_ROL: Record<Rol, EstadoTurno[]> = {
  [Rol.ADMINISTRADOR]: [
    EstadoTurno.CONFIRMADO,
    EstadoTurno.ENSALADEESPERA,
    EstadoTurno.ATENDIDO,
    EstadoTurno.CANCELADO,
  ],
  // Confirma asistencia, registra la llegada del paciente y cancela
  [Rol.RECEPCIONISTA]: [
    EstadoTurno.CONFIRMADO,
    EstadoTurno.ENSALADEESPERA,
    EstadoTurno.CANCELADO,
  ],
  [Rol.MEDICO]: [EstadoTurno.ATENDIDO],
  [Rol.ENFERMERO]: [],
};

export function puedeCambiarA(rol: Rol, destino: string): boolean {
  return (ESTADOS_PERMITIDOS_POR_ROL[rol] ?? []).includes(destino as EstadoTurno);
}