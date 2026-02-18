
import { FormData, CalculationResults, UserType } from '../types';
import { TAX_PROPORTIONS, CO2_FACTOR, TREE_CO2_ABSORPTION } from '../constants';

const parseVal = (val: number | ""): number => {
  if (val === "" || isNaN(Number(val))) return 0;
  return Number(val);
};

export const calculateResults = (data: FormData): CalculationResults => {
  const propSinPros = data.userType ? TAX_PROPORTIONS[data.userType] : 0;
  
  const energyGenerated = parseVal(data.energyGenerated);
  const energyInjected = parseVal(data.energyInjected);
  const energyDelivered = parseVal(data.energyDelivered);
  const totalToPay = parseVal(data.totalToPay);
  const subtotalTaxes = parseVal(data.subtotalTaxes);
  const subtotalEnergyElectric = parseVal(data.subtotalEnergyElectric);
  const environmentalBenefit = parseVal(data.environmentalBenefit);

  // Autoconsumo Coop,Con
  const autoconsumo = Math.max(0, energyGenerated - energyInjected);
  
  /**
   * REAFIRMACIÓN DE LÓGICA:
   * "kWh de ultima banda con" = Energía entregada (C) - suma de los kWh de las bandas previas.
   * Usamos todos los kWh ingresados EXCEPTO el de la última fila.
   */
  const penultimaBandsKwh = data.energyBands.slice(0, -1).reduce((acc, b) => acc + parseVal(b.kwh), 0);
  const kWhUltimaBandaCon = Math.max(0.0001, energyDelivered - penultimaBandsKwh);

  /**
   * "kWh de ultima banda sin" = "kWh de ultima banda con" + "Autoconsumo"
   */
  const kWhUltimaBandaSin = kWhUltimaBandaCon + autoconsumo;

  // Proporción Impuestos / Total Coop Con
  const proporcionImpuestosTotalCon = totalToPay > 0 ? subtotalTaxes / totalToPay : 0;

  // Subtotal Energía Eléctrica Coop,Sin
  const sumaCargosFijos = data.fixedCharges.reduce((acc, f) => acc + parseVal(f.amount), 0);
  
  // Suma de importes ($) de bandas hasta la penúltima
  const sumaImportesPenultima = data.energyBands.slice(0, -1).reduce((acc, b) => acc + parseVal(b.amount), 0);
  
  // Última banda para obtener el precio unitario ($/kWh)
  const lastBand = data.energyBands[data.energyBands.length - 1];
  const lastBandAmount = lastBand ? parseVal(lastBand.amount) : 0;
  const lastBandKwhInput = lastBand ? parseVal(lastBand.kwh) : 1; 

  // Subtotal Energía Eléctrica Coop,Sin
  // Se usa el precio de la última banda (importe / kWh) multiplicado por el nuevo volumen (kWh última banda Sin)
  const subtotalEnergySin = sumaCargosFijos 
    + sumaImportesPenultima 
    + (lastBandAmount / Math.max(0.0001, parseVal(lastBand?.kwh || 1))) * kWhUltimaBandaSin;

  // TOTAL A PAGAR Coop,Sin
  const taxDiff = proporcionImpuestosTotalCon - propSinPros;
  const totalAPagarSin = subtotalEnergySin / Math.max(0.0001, (1 - taxDiff));

  // Ahorros
  const ahorroTotal = totalAPagarSin - totalToPay;
  const ahorroAutoconsumo = subtotalEnergySin - subtotalEnergyElectric;
  const ahorroImpuestos = totalAPagarSin - subtotalEnergySin - subtotalTaxes;
  const ahorroReconocimientos = environmentalBenefit;

  // Eficiencia
  const eficienciaAutoconsumo = energyGenerated > 0 ? (autoconsumo / energyGenerated) * 100 : 0;
  const eficienciaInyeccion = energyGenerated > 0 ? (energyInjected / energyGenerated) * 100 : 0;

  // Impacto Ambiental
  const co2Evitado = energyGenerated * CO2_FACTOR;
  const arbolesEquivalentes = co2Evitado / TREE_CO2_ABSORPTION;

  return {
    autoconsumo,
    kWhUltimaBandaCon,
    proporcionImpuestosTotalCon,
    kWhUltimaBandaSin,
    subtotalEnergySin,
    totalAPagarSin,
    ahorroTotal,
    ahorroAutoconsumo,
    ahorroImpuestos,
    ahorroReconocimientos,
    eficienciaAutoconsumo,
    eficienciaInyeccion,
    co2Evitado,
    arbolesEquivalentes,
    propSinPros
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
};

export const formatNumber = (val: number, decimals: number = 2) => {
  return val.toLocaleString('es-AR', { 
    minimumFractionDigits: decimals, 
    maximumFractionDigits: decimals 
  });
};
