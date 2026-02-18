
export enum InterestType {
  SIMPLE = 'SIMPLE',
  COMPOUND = 'COMPOUND'
}

export type Language = 'en' | 'te' | 'hi' | 'ta' | 'kn';

export interface CalculationInput {
  principal: number;
  rate: number;
  isAnnualRate: boolean;
  useMonthsInput: boolean;
  durationMonths: number;
  startDate: string;
  endDate: string;
  interestType: InterestType;
  compoundingFrequencyMonths: number;
}

export interface CalculationResult {
  principal: number;
  totalInterest: number;
  totalAmount: number;
  monthlyInterest: number;
  years: number;
  months: number;
  days: number;
  totalDays: number;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  label?: string;
  input: CalculationInput;
  result: CalculationResult;
}
