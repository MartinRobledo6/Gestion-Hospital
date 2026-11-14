import type { Rol } from './type/auth';

// Copia en el frontend de las reglas del backend
// (estados-turnos.ts y permisos-estado.ts). Se usan solo para decidir
// qué botones mostrar: la validación real la hace siempre el backend.

export const TRANSICIONES: Record<string, string[]> = {
  Programado: ['Confirmado', 'En Sala de Espera', 'Cancelado'],
  Confirmado: ['En Sala de Espera', 'Cancelado'],
  'En Sala de Espera': ['Atendido', 'Cancelado'],
  Atendido: [],
  Cancelado: [],
};

export const ESTADOS_PERMITIDOS_POR_ROL: Record<Rol, string[]> = {
  ADMINISTRADOR: ['Confirmado', 'En Sala de Espera', 'Atendido', 'Cancelado'],
  RECEPCIONISTA: ['Confirmado', 'En Sala de Espera', 'Cancelado'],
  MEDICO: ['Atendido'],
  ENFERMERO: [],
  PACIENTE: [],
};

// Estados a los que este rol puede llevar un turno que está en `estadoActual`
export const accionesPara = (rol: Rol | null, estadoActual: string) => {
  if (!rol) return [];
  const permitidos = ESTADOS_PERMITIDOS_POR_ROL[rol] ?? [];
  return (TRANSICIONES[estadoActual] ?? []).filter((e) => permitidos.includes(e));
};