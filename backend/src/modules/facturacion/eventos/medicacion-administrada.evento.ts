// Contrato del evento entre Enfermería (emite) y Facturación (escucha).
// Enfermería debería importar esto para emitir con el mismo nombre y forma:
//   this.eventEmitter.emit(MEDICACION_ADMINISTRADA, { eventoId, pacienteId, insumo, cantidad });
export const MEDICACION_ADMINISTRADA = 'medicacion.administrada';

export interface MedicacionAdministradaEvento {
  eventoId: string; // único por administración: evita cobrar dos veces el mismo evento
  pacienteId: number;
  insumo: string; // debe coincidir con PreciosInsumos.Insumo, ej: "Ibuprofeno 400mg"
  cantidad: number;
}