
import { UserType } from './types';

export const TAX_PROPORTIONS: Record<UserType, number> = {
  [UserType.RESIDENTIAL]: 0.179,
  [UserType.COMMERCIAL]: 0.0285,
  [UserType.INDUSTRIAL]: 0.0605,
};

export const CO2_FACTOR = 0.2306;
export const TREE_CO2_ABSORPTION = 10 / 12; // 10kg per year / 12 months = monthly