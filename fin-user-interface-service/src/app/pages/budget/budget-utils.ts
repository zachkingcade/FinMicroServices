import { PlanningPeriod, IntervalType, BudgetIncome } from '../../types/Budget';

const PERIODS_PER_YEAR: Record<PlanningPeriod, number> = {
  weekly: 52,
  'bi-weekly': 26,
  monthly: 12,
  yearly: 1,
};

function incomeOccurrencesPerYear(interval_type: IntervalType, interval_count: number): number {
  if (interval_count <= 0) return 0;
  switch (interval_type) {
    case 'days':
      return 365 / interval_count;
    case 'weeks':
      return 52 / interval_count;
    case 'months':
      return 12 / interval_count;
    default:
      return 0;
  }
}

/**
 * Contribution amount for one income in the plan's period (e.g. amount per month when plan is monthly).
 * contribution = (income amount × occurrences per year for that income) / (periods per year for the plan).
 */
export function contributionForIncome(
  amount: number,
  interval_type: IntervalType,
  interval_count: number,
  planning_period: PlanningPeriod
): number {
  const occurrencesPerYear = incomeOccurrencesPerYear(interval_type, interval_count);
  const periodsPerYear = PERIODS_PER_YEAR[planning_period];
  if (periodsPerYear === 0) return 0;
  return (amount * occurrencesPerYear) / periodsPerYear;
}

/**
 * Spent from one income = sum of budget_row_amounts.amount for that income_id across all rows.
 */
export function spentForIncome(income_id: number, rowAmounts: { income_id: number; amount: number }[]): number {
  return rowAmounts
    .filter(a => a.income_id === income_id)
    .reduce((sum, a) => sum + (a.amount || 0), 0);
}
