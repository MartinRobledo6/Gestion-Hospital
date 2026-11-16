// El secret firma los tokens: si alguien lo conoce, puede fabricar un token con cualquier rol.
// Por eso no hay valor por defecto: sin JWT_SECRET en el .env, el backend no arranca.
export function obtenerJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error(
      'Falta JWT_SECRET en backend/.env. El backend no arranca sin un secret para firmar los tokens.',
    );
  }

  return secret;
}
