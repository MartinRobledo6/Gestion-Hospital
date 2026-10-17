import { jest } from "@jest/globals";
import { FacturacionService } from "./facturacion.service";

describe("FacturacionService", () => {
  let service: FacturacionService;

  // Mocks puros de las funciones de base de datos
  const mockCuentaRepo = {
    findOneBy: jest.fn(),
    save: jest.fn(),
  } as any;

  const mockCargoRepo = {
    save: jest.fn(),
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    // Inyección de dependencias manual (evita @nestjs/testing por completo)
    service = new FacturacionService(mockCuentaRepo, mockCargoRepo);
  });

  it("Debería facturar a PREPAGA: cobra $3000 al paciente y el resto a terceros", async () => {
    mockCuentaRepo.findOneBy.mockResolvedValue({
      Id: 1,
      tipoCobertura: "Prepaga",
      TotalCargoPaciente: 0,
      TotalCargoTerceros: 0,
    });

    const resultado = await service.generarCargo(
      1,
      15000,
      "Consulta",
      "Prepaga",
      0,
    );

    expect(resultado.TotalCargoPaciente).toBe(3000);
    expect(resultado.TotalCargoTerceros).toBe(12000);
    expect(mockCargoRepo.save).toHaveBeenCalledTimes(2);
  });

  it("Debería facturar a PÚBLICA: $0 al paciente y el 100% al Estado", async () => {
    mockCuentaRepo.findOneBy.mockResolvedValue({
      Id: 2,
      tipoCobertura: "Pública",
      TotalCargoPaciente: 0,
      TotalCargoTerceros: 0,
    });

    const resultado = await service.generarCargo(
      2,
      10000,
      "Radiografía",
      "Pública",
      0,
    );

    expect(resultado.TotalCargoPaciente).toBe(0);
    expect(resultado.TotalCargoTerceros).toBe(10000);
  });

  it("Debería facturar a PARTICULAR: 100% al paciente y $0 a terceros", async () => {
    mockCuentaRepo.findOneBy.mockResolvedValue({
      Id: 3,
      tipoCobertura: "Particular",
      TotalCargoPaciente: 0,
      TotalCargoTerceros: 0,
    });

    const resultado = await service.generarCargo(
      3,
      5000,
      "Insumos",
      "Particular",
      0,
    );

    expect(resultado.TotalCargoPaciente).toBe(5000);
    expect(resultado.TotalCargoTerceros).toBe(0);
  });
});
