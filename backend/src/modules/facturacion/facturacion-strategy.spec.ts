import { obtenerEstrategia } from './facturacion-strategy.js';
import { TipoCobertura } from './entities/cobertura.entity.js';

// Patrón Strategy - Módulo de Facturación, HU 1.1
// Cada cobertura reparte el costo de una prestación de forma distinta.
describe('Estrategias de facturación (HU 1.1)', () => {
  const CONSULTA = 15000;

  it('Escenario 1 - Pública: el paciente paga $0 y el Estado $15000', () => {
    const cobro = obtenerEstrategia(TipoCobertura.PUBLICA).calcular(CONSULTA, 0);
    expect(cobro).toEqual({ paciente: 0, terceros: 15000 });
  });

  it('Escenario 2 - Prepaga con copago $3000: el paciente paga $3000 y la prepaga $12000', () => {
    const cobro = obtenerEstrategia(TipoCobertura.PREPAGA).calcular(CONSULTA, 3000);
    expect(cobro).toEqual({ paciente: 3000, terceros: 12000 });
  });

  it('Particular: el paciente paga el 100%', () => {
    const cobro = obtenerEstrategia(TipoCobertura.PARTICULAR).calcular(CONSULTA, 0);
    expect(cobro).toEqual({ paciente: 15000, terceros: 0 });
  });

  it('Prepaga con prestación más barata que el copago: el paciente paga solo el costo', () => {
    const cobro = obtenerEstrategia(TipoCobertura.PREPAGA).calcular(2000, 3000);
    expect(cobro).toEqual({ paciente: 2000, terceros: 0 });
  });

  it('Reconoce el tipo aunque venga escrito distinto desde HCE ("Prepaga", "Obra Social")', () => {
    expect(obtenerEstrategia('Prepaga').calcular(CONSULTA, 3000).paciente).toBe(3000);
    expect(obtenerEstrategia('Obra Social Pública').calcular(CONSULTA, 0).paciente).toBe(0);
  });

  it('Un tipo desconocido se cobra como particular', () => {
    expect(obtenerEstrategia('Cualquier cosa').calcular(CONSULTA, 0)).toEqual({
      paciente: 15000,
      terceros: 0,
    });
  });
});
