const BASE_URL: string = import.meta.env.VITE_API_URL ?? '/api'

/** Error con el status HTTP, para poder distinguir 400 (validación) de 500 o de "sin conexión". */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

/**
 * NestJS responde los errores como { statusCode, message: string | string[], error }.
 * Cuando falla la validación, `message` es un array con un texto por campo.
 */
async function leerMensajeDeError(response: Response): Promise<string> {
  try {
    const body = await response.json()
    if (Array.isArray(body.message)) return body.message.join('. ')
    if (typeof body.message === 'string') return body.message
  } catch {
    // El cuerpo no era JSON: usamos el mensaje genérico de abajo.
  }
  return `El servidor respondió con un error (${response.status}).`
}

export async function http<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response
  try {
    response = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    // fetch solo lanza excepción si no hubo respuesta (backend apagado, red caída).
    throw new ApiError(
      'No se pudo conectar con el servidor. Verificá que el backend esté corriendo en el puerto 3000.',
      0,
    )
  }

  if (!response.ok) {
    throw new ApiError(await leerMensajeDeError(response), response.status)
  }
  return (await response.json()) as T
}
