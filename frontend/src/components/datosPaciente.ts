// Datos que pide la tabla Pacientes. El DNI identifica al paciente:
// si ya existe, el backend usa ese registro; si no, lo crea con estos datos.
export interface DatosPaciente {
  documento: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: string; // YYYY-MM-DD
  coberturaId: number | null;
}

export interface CoberturaOpcion {
  id: number;
  nombre: string;
}

export const pacienteVacio = (): DatosPaciente => ({
  documento: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: '',
  coberturaId: null,
});

// Lo que viaja al backend: sin cobertura elegida no se manda (queda Particular)
export const datosParaEnviar = (d: DatosPaciente) => ({
  documento: d.documento.trim(),
  nombre: d.nombre.trim(),
  apellido: d.apellido.trim(),
  fechaNacimiento: d.fechaNacimiento,
  ...(d.coberturaId != null ? { coberturaId: d.coberturaId } : {}),
});
