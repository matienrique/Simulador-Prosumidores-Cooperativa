
export enum DistributionType {
  COOPERATIVA = 'Cooperativa Eléctrica'
}

export enum ProsumerStatus {
  YES = 'Soy Prosumidor',
  NO = 'No Soy Prosumidor'
}

export enum UserCategory {
  RESIDENTIAL = 'Usuario Residencial',
  COMMERCIAL = 'Usuario Comercial',
  INDUSTRIAL = 'Usuario Industrial',
  LARGE_DEMAND = 'Usuario Gran Demanda'
}

// UserType used for tax calculations and form selection
export enum UserType {
  RESIDENTIAL = 'Residencial',
  COMMERCIAL = 'Comercial',
  INDUSTRIAL = 'Industrial'
}

// DemandType used for identifying user scale
export enum DemandType {
  SMALL = 'Pequeña Demanda',
  LARGE = 'Gran Demanda'
}

// FixedCharge structure for invoice details
export interface FixedCharge {
  id: string;
  amount: number | "";
}

// EnergyBand structure for consumption bands
export interface EnergyBand {
  id: string;
  kwh: number | "";
  amount: number | "";
}

// FormData representing the input from calculation forms
export interface FormData {
  userType: UserType;
  energyGenerated: number | "";
  energyInjected: number | "";
  energyDelivered: number | "";
  environmentalBenefit: number | "";
  subtotalEnergyElectric: number | "";
  totalToPay: number | "";
  subtotalTaxes: number | "";
  fixedCharges: FixedCharge[];
  energyBands: EnergyBand[];
}

// CalculationResults containing all derived data from the calculator service
export interface CalculationResults {
  autoconsumo: number;
  kWhUltimaBandaCon: number;
  proporcionImpuestosTotalCon: number;
  kWhUltimaBandaSin: number;
  subtotalEnergySin: number;
  totalAPagarSin: number;
  ahorroTotal: number;
  ahorroAutoconsumo: number;
  ahorroImpuestos: number;
  ahorroReconocimientos: number;
  eficienciaAutoconsumo: number;
  eficienciaInyeccion: number;
  co2Evitado: number;
  arbolesEquivalentes: number;
  propSinPros: number;
}

export interface AppState {
  distribution: DistributionType | null;
  prosumerStatus: ProsumerStatus | null;
  category: UserCategory | null;
}
