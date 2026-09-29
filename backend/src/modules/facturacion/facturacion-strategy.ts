// 1. Interfaz común
export interface IEstrategiaFacturacion {
  calcular(
    costoBase: number,
    copagoFijo?: number,
  ): { paciente: number; terceros: number };
}

// 2. Estrategias
export class EstrategiaPublica implements IEstrategiaFacturacion {
  calcular(costoBase: number) {
    return { paciente: 0, terceros: costoBase };
  }
}

export class EstrategiaPrepaga implements IEstrategiaFacturacion {
  calcular(costoBase: number, copagoFijo: number = 0) {
    const terceros = costoBase > copagoFijo ? costoBase - copagoFijo : 0;
    return { paciente: copagoFijo, terceros: terceros };
  }
}

export class EstrategiaParticular implements IEstrategiaFacturacion {
  calcular(costoBase: number) {
    return { paciente: costoBase, terceros: 0 };
  }
}

// 3. Factory para elegir la correcta
export class EstrategiaFactory {
  static crear(tipo: string): IEstrategiaFacturacion {
    switch (tipo) {
      case "Pública":
        return new EstrategiaPublica();
      case "Prepaga":
        return new EstrategiaPrepaga();
      case "Particular":
        return new EstrategiaParticular();
      default:
        throw new Error("Cobertura no soportada");
    }
  }
}
