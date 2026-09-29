import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { OnEvent } from "@nestjs/event-emitter";
import { CuentaEstadia } from "./cuenta-estadia.entity";
import { CargoAutomatico } from "./cargo-automatico.entity";
import { EstrategiaFactory } from "./facturacion-strategy";

@Injectable()
export class FacturacionService {
  constructor(
    @InjectRepository(CuentaEstadia)
    private cuentaRepo: Repository<CuentaEstadia>,
    @InjectRepository(CargoAutomatico)
    private cargoRepo: Repository<CargoAutomatico>,
  ) {}

  // Recibe el tipo de cobertura como parámetro, ya que en la BD viene del Paciente
  async generarCargo(
    cuentaId: number,
    costoBase: number,
    concepto: string,
    tipoCobertura: string,
    eventoId: number,
  ) {
    const cuenta = await this.cuentaRepo.findOneBy({ Id: cuentaId });
    if (!cuenta) throw new Error("Cuenta no encontrada");

    const estrategia = EstrategiaFactory.crear(tipoCobertura);
    const cobro = estrategia.calcular(costoBase, 3000); // 3000 de copago fijo ejemplo

    if (cobro.paciente > 0) {
      await this.cargoRepo.save({
        CuentaEstadiaId: cuentaId,
        Concepto: `${concepto} (Paciente)`,
        Monto: cobro.paciente,
        ReferenciaEventoId: eventoId,
      });
      cuenta.TotalCargoPaciente =
        Number(cuenta.TotalCargoPaciente) + Number(cobro.paciente);
    }

    if (cobro.terceros > 0) {
      await this.cargoRepo.save({
        CuentaEstadiaId: cuentaId,
        Concepto: `${concepto} (Terceros)`,
        Monto: cobro.terceros,
        ReferenciaEventoId: eventoId,
      });
      cuenta.TotalCargoTerceros =
        Number(cuenta.TotalCargoTerceros) + Number(cobro.terceros);
    }

    await this.cuentaRepo.save(cuenta);
    return cuenta;
  }

  @OnEvent("insumo.consumido")
  async handleInsumoConsumido(payload: {
    pacienteId: number;
    insumo: string;
    costoTotal: number;
    tipoCobertura: string;
    eventoId: number;
  }) {
    const cuenta = await this.cuentaRepo.findOneBy({
      PacienteId: payload.pacienteId,
      Estado: "Abierta",
    });
    if (cuenta) {
      await this.generarCargo(
        cuenta.Id,
        payload.costoTotal,
        `Insumo: ${payload.insumo}`,
        payload.tipoCobertura,
        payload.eventoId,
      );
    }
  }
}
