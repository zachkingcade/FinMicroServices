export type PlanningPeriod = 'weekly' | 'bi-weekly' | 'monthly' | 'yearly';
export type IntervalType = 'days' | 'weeks' | 'months';

export interface BudgetPlan {
    plan_id?: number;
    name: string;
    planning_period: PlanningPeriod;
}

export interface BudgetIncome {
    income_id?: number;
    plan_id: number;
    name?: string;
    amount: number;
    interval_type: IntervalType;
    interval_count: number;
}

export interface BudgetRow {
    row_id?: number;
    plan_id: number;
    account_code: number;
}

export interface BudgetRowAmount {
    row_id: number;
    income_id: number;
    amount: number;
}

export interface BudgetPlanCreateDTO {
    name: string;
    planning_period: PlanningPeriod;
}

export interface BudgetIncomeCreateDTO {
    plan_id: number;
    name?: string;
    amount: number;
    interval_type: IntervalType;
    interval_count: number;
}

export interface BudgetRowAmountUpdateDTO {
    row_id: number;
    amounts: { income_id: number; amount: number }[];
}
