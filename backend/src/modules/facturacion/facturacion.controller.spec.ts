import { jest } from "@jest/globals";
import { FacturacionController } from "./facturacion.controller";

describe("FacturacionController", () => {
  let controller: FacturacionController;

  const mockService = {
    generarCargo: jest
      .fn<() => Promise<{ id: number; estado: string }>>()
      .mockResolvedValue({ id: 1, estado: "Abierta" }),
  } as any;

  beforeEach(() => {
    // Inyección manual al controlador
    controller = new FacturacionController(mockService);
  });

  it("Debería llamar al servicio e inyectar el eventoId por defecto en 0", async () => {
    const body = {
      costoBase: 8000,
      concepto: "Ecografía",
      tipoCobertura: "Particular",
    };

    await controller.crearCargoManual("1", body);

    expect(mockService.generarCargo).toHaveBeenCalledWith(
      1,
      8000,
      "Ecografía",
      "Particular",
      0,
    );
  });
});
