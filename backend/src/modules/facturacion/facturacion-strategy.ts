import { TipoCobertura } from './entities/cobertura.entity.js';

// Patrón Strategy: cada cobertura sabe cómo repartir el costo de una prestación
export interface ResultadoCobro {
  paciente: number; // lo que abona el paciente
  terceros: number; // lo que se le factura al Estado o a la prepaga
}

export interface EstrategiaFacturacion {
  calcular(costoBase: number, copagoFijo: number): ResultadoCobro;
}

// Pública: subsidia el 100%, el paciente abona 0
export class EstrategiaPublica implements EstrategiaFacturacion {
  calcular(costoBase: number): ResultadoCobro {
    return { paciente: 0, terceros: costoBase };
  }
}

// Prepaga: el paciente paga el copago fijo y el resto va a la prepaga.
// Si la prestación cuesta menos que el copago, el paciente paga solo el costo.
export class EstrategiaPrepaga implements EstrategiaFacturacion {
  calcular(costoBase: number, copagoFijo: number): ResultadoCobro {
    const paciente = Math.min(copagoFijo, costoBase);
    return { paciente, terceros: costoBase - paciente };
  }
}

// Particular (sin cobertura): el paciente paga el 100%
export class EstrategiaParticular implements EstrategiaFacturacion {
  calcular(costoBase: number): ResultadoCobro {
    return { paciente: costoBase, terceros: 0 };
  }
}

// Un Record tipado reemplaza al switch: si mañana se agrega un TipoCobertura
// y no se le asigna estrategia, TypeScript no compila.
const ESTRATEGIAS: Record<TipoCobertura, EstrategiaFacturacion> = {
  [TipoCobertura.PUBLICA]: new EstrategiaPublica(),
  [TipoCobertura.PREPAGA]: new EstrategiaPrepaga(),
  [TipoCobertura.PARTICULAR]: new EstrategiaParticular(),
};

export const obtenerEstrategia = (tipo: TipoCobertura): EstrategiaFacturacion =>
  ESTRATEGIAS[tipo];