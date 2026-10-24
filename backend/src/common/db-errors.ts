// Errores 2601 / 2627 de SQL Server = violación de índice/constraint único
export function esViolacionUnique(e: unknown): boolean {
  const err = e as { number?: number; driverError?: { number?: number } };
  const num = err?.driverError?.number ?? err?.number;
  return num === 2601 || num === 2627;
}