import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { DataSource, Repository } from 'typeorm';
import { CuentaEstadia } from './entities/cuenta-estadia.entity.js';
import { CargoAutomatico, Destinatario } from './entities/cargo-automatico.entity.js';
import { Cobertura, TipoCobertura } from './entities/cobertura.entity.js';
import { PrecioInsumo } from './entities/precio.insumo.entity.js';
import { PacienteEntity } from '../admision/entities/paciente.entity.js';
import { obtenerEstrategia } from './facturacion-strategy.js';
import { MEDICACION_ADMINISTRADA } from './eventos/medicacion-administrada.evento.js';
import type { MedicacionAdministradaEvento } from './eventos/medicacion-administrada.evento.js';

const CUENTA_ABIERTA = 'Abierta';
const CUENTA_CERRADA = 'Cerrada';

// SQL Server devuelve las columnas decimal como string ("15000.00")
const aNumero = (valor: unknown) => Number(valor ?? 0);

// La cobertura "efectiva" de un paciente al momento de facturar
export interface CoberturaAplicada {
  nombre: string;
  tipo: TipoCobertura;
  copagoFijo: number;
}

const SIN_COBERTURA: CoberturaAplicada = {
  nombre: 'Particular (sin cobertura)',
  tipo: TipoCobertura.PARTICULAR,
  copagoFijo: 0,
};

interface DatosCargo {
  cuentaId: number;
  costoBase: number;
  tipoCobertura: TipoCobertura;
  copagoFijo: number;
  concepto: string;
  detalle: string | null;
  eventoId: string | null;
  // HU 1.1 Esc. 1: una prestación pública genera igual un cargo de $0 al paciente
  registrarCargoPacienteEnCero: boolean;
}

@Injectable()
export class FacturacionService implements OnModuleInit {
  private readonly logger = new Logger(FacturacionService.name);

  constructor(
    @InjectRepository(CuentaEstadia)
    private readonly cuentasRepo: Repository<CuentaEstadia>,
    @InjectRepository(CargoAutomatico)
    private readonly cargosRepo: Repository<CargoAutomatico>,
    @InjectRepository(Cobertura)
    private readonly coberturasRepo: Repository<Cobertura>,
    @InjectRepository(PrecioInsumo)
    private readonly preciosRepo: Repository<PrecioInsumo>,
    @InjectRepository(PacienteEntity)
    private readonly pacientesRepo: Repository<PacienteEntity>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // Datos iniciales para poder probar las HU con una base vacía
  async onModuleInit() {
    if ((await this.coberturasRepo.count()) === 0) {
      await this.coberturasRepo.save([
        { Nombre: 'Obra Social Pública', Tipo: TipoCobertura.PUBLICA, CopagoFijo: 0 },
        { Nombre: 'Medicina Prepaga Premium', Tipo: TipoCobertura.PREPAGA, CopagoFijo: 3000 },
      ]);
    }
    if ((await this.preciosRepo.count()) === 0) {
      await this.preciosRepo.save([
        { Insumo: 'Ibuprofeno 400mg', PrecioUnitario: 850 },
        { Insumo: 'Paracetamol 500mg', PrecioUnitario: 600 },
        { Insumo: 'Amoxicilina 500mg', PrecioUnitario: 1200 },
      ]);
    }
  }

  // ---------- Catálogos ----------

  async listarCoberturas() {
    const coberturas = await this.coberturasRepo.find({ order: { Nombre: 'ASC' } });
    return coberturas.map((c) => ({ ...c, CopagoFijo: aNumero(c.CopagoFijo) }));
  }

  async listarPreciosInsumos() {
    const precios = await this.preciosRepo.find({ order: { Insumo: 'ASC' } });
    return precios.map((p) => ({ ...p, PrecioUnitario: aNumero(p.PrecioUnitario) }));
  }

  // ---------- Pacientes y cobertura ----------

  async listarPacientes() {
    const [pacientes, coberturas, abiertas] = await Promise.all([
      this.pacientesRepo.find({ order: { nombre: 'ASC' } }),
      this.coberturasRepo.find(),
      this.cuentasRepo.findBy({ Estado: CUENTA_ABIERTA }),
    ]);

    return pacientes.map((p) => ({
      id: p.id,
      nombre: p.nombre,
      email: p.email,
      coberturaId: p.coberturaId,
      coberturaNombre:
        coberturas.find((c) => c.Id === p.coberturaId)?.Nombre ?? SIN_COBERTURA.nombre,
      cuentaAbiertaId: abiertas.find((c) => c.PacienteId === p.id)?.Id ?? null,
    }));
  }

  async asignarCobertura(pacienteId: number, coberturaId: number | null) {
    const paciente = await this.buscarPaciente(pacienteId);

    if (coberturaId !== null) {
      const existe = await this.coberturasRepo.existsBy({ Id: coberturaId });
      if (!existe) throw new NotFoundException('La cobertura no existe');
    }

    paciente.coberturaId = coberturaId;
    await this.pacientesRepo.save(paciente);
    return { pacienteId, coberturaId };
  }

  // ---------- Cuentas de estadía ----------

  async listarCuentas() {
    const cuentas = await this.cuentasRepo.find({ order: { Id: 'DESC' } });
    const pacientes = await this.pacientesRepo.find();

    return cuentas.map((c) => ({
      ...this.formatearCuenta(c),
      pacienteNombre: pacientes.find((p) => p.id === c.PacienteId)?.nombre ?? '—',
    }));
  }

  async abrirCuenta(pacienteId: number) {
    await this.buscarPaciente(pacienteId);

    const yaAbierta = await this.cuentasRepo.existsBy({
      PacienteId: pacienteId,
      Estado: CUENTA_ABIERTA,
    });
    if (yaAbierta) throw new ConflictException('El paciente ya tiene una cuenta abierta');

    const cuenta = await this.cuentasRepo.save(
      this.cuentasRepo.create({ PacienteId: pacienteId }),
    );
    return this.formatearCuenta(cuenta);
  }

  async cerrarCuenta(id: number) {
  const cuenta = await this.buscarCuentaAbierta(id);

  cuenta.Estado = CUENTA_CERRADA;
  await this.cuentasRepo.save(cuenta);

  return this.formatearCuenta(cuenta);
}
async resumenFacturado() {
    const filas = await this.cargosRepo
      .createQueryBuilder('cargo')
      .select('cargo.Destinatario', 'destinatario')
      .addSelect('SUM(cargo.Monto)', 'total')
      .groupBy('cargo.Destinatario')
      .getRawMany<{ destinatario: Destinatario; total: string }>();

    // Arrancamos con los tres en 0: GROUP BY no devuelve los grupos sin cargos
    const resumen: Record<Destinatario, number> = {
      [Destinatario.PACIENTE]: 0,
      [Destinatario.ESTADO]: 0,
      [Destinatario.PREPAGA]: 0,
    };

    for (const fila of filas) {
      resumen[fila.destinatario] = aNumero(fila.total);
    }

    return resumen;
  }

  async obtenerCuenta(id: number) {
    const cuenta = await this.cuentasRepo.findOneBy({ Id: id });
    if (!cuenta) throw new NotFoundException('Cuenta no encontrada');

    const paciente = await this.buscarPaciente(cuenta.PacienteId);
    const cobertura = await this.coberturaDe(paciente);
    const cargos = await this.cargosRepo.find({
      where: { CuentaEstadiaId: id },
      order: { Id: 'DESC' },
    });

    return {
      ...this.formatearCuenta(cuenta),
      pacienteNombre: paciente.nombre,
      cobertura,
      cargos: cargos.map((c) => ({ ...c, Monto: aNumero(c.Monto) })),
    };
  }

  // ---------- HU 1.1: Cálculo dinámico de costos de prestaciones ----------

  async facturarPrestacion(cuentaId: number, costoBase: number, concepto: string) {
    const cuenta = await this.buscarCuentaAbierta(cuentaId);
    const paciente = await this.buscarPaciente(cuenta.PacienteId);
    const cobertura = await this.coberturaDe(paciente);

    const cobro = await this.registrarCargos({
      cuentaId,
      costoBase,
      tipoCobertura: cobertura.tipo,
      copagoFijo: cobertura.copagoFijo,
      concepto,
      detalle: null,
      eventoId: null,
      registrarCargoPacienteEnCero: true,
    });

    return { cobertura: cobertura.nombre, ...cobro };
  }

  // ---------- HU 2.1: Cargo automático por consumo de insumos ----------

  // async: true → el listener corre aparte y no bloquea a quien emite (Enfermería)
  @OnEvent(MEDICACION_ADMINISTRADA, { async: true, promisify: true })
  async onMedicacionAdministrada(evento: MedicacionAdministradaEvento) {
    try {
      // Mismo evento recibido dos veces → no cobrar de nuevo
      const yaProcesado = await this.cargosRepo.existsBy({
        ReferenciaEventoId: evento.eventoId,
      });
      if (yaProcesado) return;

      const cuenta = await this.cuentasRepo.findOneBy({
        PacienteId: evento.pacienteId,
        Estado: CUENTA_ABIERTA,
      });
      if (!cuenta) {
        this.logger.warn(
          `Evento ${evento.eventoId}: el paciente ${evento.pacienteId} no tiene cuenta abierta`,
        );
        return;
      }

      const precio = await this.preciosRepo.findOneBy({ Insumo: evento.insumo });
      if (!precio) {
        this.logger.warn(`Evento ${evento.eventoId}: "${evento.insumo}" no está en la lista de precios`);
        return;
      }

      const paciente = await this.buscarPaciente(evento.pacienteId);
      const cobertura = await this.coberturaDe(paciente);

      await this.registrarCargos({
        cuentaId: cuenta.Id,
        costoBase: aNumero(precio.PrecioUnitario) * evento.cantidad,
        tipoCobertura: cobertura.tipo,
        copagoFijo: 0, // el copago es por consulta, no por insumo
        concepto: 'Insumos de Farmacia',
        detalle: `${evento.insumo} x ${evento.cantidad}`,
        eventoId: evento.eventoId,
        registrarCargoPacienteEnCero: false,
      });
    } catch (error) {
      // Nadie espera la respuesta de un evento: si falla, al menos que quede en el log
      this.logger.error(`No se pudo procesar el evento ${evento.eventoId}`, error);
    }
  }

  // Reemplaza a Enfermería mientras ese módulo no esté integrado
  async simularMedicacionAdministrada(pacienteId: number, insumo: string, cantidad: number) {
    const evento: MedicacionAdministradaEvento = {
      eventoId: randomUUID(),
      pacienteId,
      insumo,
      cantidad,
    };
    // emitAsync espera a los listeners solo para que la vista muestre el cargo al toque.
    // Enfermería usaría emit(), que no espera.
    await this.eventEmitter.emitAsync(MEDICACION_ADMINISTRADA, evento);
    return { eventoId: evento.eventoId };
  }

  // ---------- Privados ----------

  // Aplica la estrategia y guarda cargos + totales en una sola transacción:
  // o se guarda todo, o no se guarda nada.
  private async registrarCargos(datos: DatosCargo) {
    return this.dataSource.transaction(async (manager) => {
      const cuenta = await manager.findOneByOrFail(CuentaEstadia, { Id: datos.cuentaId });

      const cobro = obtenerEstrategia(datos.tipoCobertura).calcular(
        datos.costoBase,
        datos.copagoFijo,
      );

      const base = {
        CuentaEstadiaId: datos.cuentaId,
        Concepto: datos.concepto,
        Detalle: datos.detalle,
        ReferenciaEventoId: datos.eventoId,
      };
      const cargos: Partial<CargoAutomatico>[] = [];

      if (cobro.paciente > 0 || datos.registrarCargoPacienteEnCero) {
        cargos.push({ ...base, Destinatario: Destinatario.PACIENTE, Monto: cobro.paciente });
      }
      if (cobro.terceros > 0) {
        const destinatario =
          datos.tipoCobertura === TipoCobertura.PUBLICA ? Destinatario.ESTADO : Destinatario.PREPAGA;
        cargos.push({ ...base, Destinatario: destinatario, Monto: cobro.terceros });
      }

      await manager.save(CargoAutomatico, cargos);

      cuenta.TotalCargoPaciente = aNumero(cuenta.TotalCargoPaciente) + cobro.paciente;
      cuenta.TotalCargoTerceros = aNumero(cuenta.TotalCargoTerceros) + cobro.terceros;
      await manager.save(cuenta);

      return cobro;
    });
  }

  private async coberturaDe(paciente: PacienteEntity): Promise<CoberturaAplicada> {
    if (paciente.coberturaId === null) return SIN_COBERTURA;

    const cobertura = await this.coberturasRepo.findOneBy({ Id: paciente.coberturaId });
    if (!cobertura) return SIN_COBERTURA;

    return {
      nombre: cobertura.Nombre,
      tipo: cobertura.Tipo,
      copagoFijo: aNumero(cobertura.CopagoFijo),
    };
  }

  private async buscarPaciente(id: number) {
    const paciente = await this.pacientesRepo.findOneBy({ id });
    if (!paciente) throw new NotFoundException('Paciente no encontrado');
    return paciente;
  }

  private async buscarCuentaAbierta(id: number) {
    const cuenta = await this.cuentasRepo.findOneBy({ Id: id });
    if (!cuenta) throw new NotFoundException('Cuenta no encontrada');
    if (cuenta.Estado !== CUENTA_ABIERTA) {
      throw new BadRequestException('La cuenta está cerrada');
    }
    return cuenta;
  }

  private formatearCuenta(c: CuentaEstadia) {
    return {
      Id: c.Id,
      PacienteId: c.PacienteId,
      Estado: c.Estado,
      FechaApertura: c.FechaApertura,
      TotalCargoPaciente: aNumero(c.TotalCargoPaciente),
      TotalCargoTerceros: aNumero(c.TotalCargoTerceros),
    };
  }
}
