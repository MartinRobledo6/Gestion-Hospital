export type Rol =
  | 'ADMINISTRADOR'
  | 'MEDICO'
  | 'ENFERMERO'
  | 'RECEPCIONISTA'
  | 'MAESTRANZA'
  | 'PACIENTE'

export interface Usuario {
  id: number
  nombre: string
  email: string
  rol: Rol
}

export interface LoginResponse {
  access_token: string
  usuario: Usuario
}