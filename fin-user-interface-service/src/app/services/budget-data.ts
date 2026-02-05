import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BudgetPlan, BudgetIncome, BudgetRow, BudgetRowAmount, BudgetPlanFull, PlanningPeriod, IntervalType } from '../types/Budget';
import { Campfire } from './campfire';

@Injectable({
  providedIn: 'root',
})
export class BudgetData {

  constructor(
    private http: HttpClient,
    private campfire: Campfire
  ) {}

  getPlans(): Observable<BudgetPlan[]> {
    this.campfire.debug('BudgetData GET /budget/plans');
    return this.http.get<BudgetPlan[]>('/budget/plans');
  }

  getPlanFull(plan_id: number): Observable<BudgetPlanFull> {
    this.campfire.debug(`BudgetData GET /budget/plan/${plan_id}`);
    return this.http.get<BudgetPlanFull>(`/budget/plan/${plan_id}`);
  }

  createPlan(name: string, planning_period: PlanningPeriod): Observable<{ status: string; plan_id: number }> {
    this.campfire.debug('BudgetData POST /budget/plan', { name, planning_period });
    return this.http.post<{ status: string; plan_id: number }>('/budget/plan', { name, planning_period });
  }

  updatePlan(plan_id: number, name: string, planning_period: PlanningPeriod): Observable<{ status: string }> {
    this.campfire.debug('BudgetData POST /budget/plan/update', { plan_id, name, planning_period });
    return this.http.post<{ status: string }>('/budget/plan/update', { plan_id, name, planning_period });
  }

  deletePlan(plan_id: number): Observable<{ status: string }> {
    this.campfire.debug('BudgetData POST /budget/plan/delete', { plan_id });
    return this.http.post<{ status: string }>('/budget/plan/delete', { plan_id });
  }

  duplicatePlan(plan_id: number): Observable<{ status: string; plan_id: number }> {
    this.campfire.debug('BudgetData POST /budget/plan/duplicate', { plan_id });
    return this.http.post<{ status: string; plan_id: number }>('/budget/plan/duplicate', { plan_id });
  }

  addIncome(plan_id: number, name: string | null, amount: number, interval_type: IntervalType, interval_count: number): Observable<{ status: string; income_id: number }> {
    this.campfire.debug('BudgetData POST /budget/income', { plan_id, name, amount, interval_type, interval_count });
    return this.http.post<{ status: string; income_id: number }>('/budget/income', { plan_id, name, amount, interval_type, interval_count });
  }

  updateIncome(income_id: number, name: string | null, amount: number, interval_type: IntervalType, interval_count: number): Observable<{ status: string }> {
    this.campfire.debug('BudgetData POST /budget/income/update', { income_id, name, amount, interval_type, interval_count });
    return this.http.post<{ status: string }>('/budget/income/update', { income_id, name, amount, interval_type, interval_count });
  }

  deleteIncome(income_id: number): Observable<{ status: string }> {
    this.campfire.debug('BudgetData POST /budget/income/delete', { income_id });
    return this.http.post<{ status: string }>('/budget/income/delete', { income_id });
  }

  addRow(plan_id: number, account_code: number): Observable<{ status: string; row_id: number }> {
    this.campfire.debug('BudgetData POST /budget/row', { plan_id, account_code });
    return this.http.post<{ status: string; row_id: number }>('/budget/row', { plan_id, account_code });
  }

  deleteRow(row_id: number): Observable<{ status: string }> {
    this.campfire.debug('BudgetData POST /budget/row/delete', { row_id });
    return this.http.post<{ status: string }>('/budget/row/delete', { row_id });
  }

  setRowAmounts(row_id: number, amounts: { income_id: number; amount: number }[]): Observable<{ status: string }> {
    this.campfire.debug('BudgetData POST /budget/row/amounts', { row_id, amounts });
    return this.http.post<{ status: string }>('/budget/row/amounts', { row_id, amounts });
  }
}
