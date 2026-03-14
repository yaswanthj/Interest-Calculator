
import { CalculationInput, CalculationResult, InterestType } from '../types';

export const calculateInterest = (input: CalculationInput, typeOverride?: InterestType): CalculationResult => {
  const selectedType = typeOverride || input.interestType;
  let totalDays = 0;
  let years = 0;
  let months = 0;
  let days = 0;

  if (input.useMonthsInput) {
    months = input.durationMonths;
    totalDays = months * 30; // Standard approximation for financial calculations
    years = Math.floor(months / 12);
    months = months % 12;
  } else {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (end < start) throw new Error('End date must be after start date');
    const timeDiff = end.getTime() - start.getTime();
    totalDays = Math.floor(timeDiff / (1000 * 3600 * 24));
    years = Math.floor(totalDays / 365);
    let remainingDays = totalDays % 365;
    months = Math.floor(remainingDays / 30);
    days = remainingDays % 30;
  }

  // Calculate Rate
  // Traditional Telugu rate: X rupees per 100 per month = X% per month
  // Annual rate: Y% per year = (Y/12)% per month
  const monthlyRatePercent = input.isAnnualRate ? (input.rate / 12) : input.rate;
  const monthlyRateDecimal = monthlyRatePercent / 100;
  const totalMonthsDecimal = totalDays / 30;

  let totalInterest = 0;

  if (selectedType === InterestType.SIMPLE) {
    totalInterest = input.principal * monthlyRateDecimal * totalMonthsDecimal;
  } else {
    // Compound interest: A = P(1 + r)^n
    // Compounding frequency logic
    const compoundingMonths = input.compoundingFrequencyMonths;
    const periods = totalMonthsDecimal / compoundingMonths;
    const ratePerPeriod = monthlyRateDecimal * compoundingMonths;
    const amount = input.principal * Math.pow(1 + ratePerPeriod, periods);
    totalInterest = amount - input.principal;
  }

  return {
    principal: input.principal,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalAmount: Math.round((input.principal + totalInterest) * 100) / 100,
    monthlyInterest: Math.round((totalInterest / totalMonthsDecimal) * 100) / 100,
    years,
    months,
    days,
    totalDays
  };
};
