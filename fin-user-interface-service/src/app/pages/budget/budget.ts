import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { Confirmation } from '../../components/confirmation/confirmation';
import { BudgetPlanAdd } from '../../components/budget-plan-add/budget-plan-add';
import { BudgetIncomeAdd } from '../../components/budget-income-add/budget-income-add';
import { BudgetNameEdit } from '../../components/budget-name-edit/budget-name-edit';
import { FormsModule } from '@angular/forms';
import { BudgetData } from '../../services/budget-data';
import { AccountsData } from '../../services/accounts-data';
import { Campfire } from '../../services/campfire';
import {
  BudgetPlan,
  BudgetIncome,
  BudgetRow,
  BudgetRowAmount,
  BudgetPlanFull,
  PlanningPeriod,
  IntervalType,
} from '../../types/Budget';
import { Account } from '../../types/Account';
import { AccountType } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { contributionForIncome, spentForIncome } from './budget-utils';

@Component({
  selector: 'app-budget',
  imports: [NavBar, CommonModule, FeatherModule, FormsModule],
  templateUrl: './budget.html',
  styleUrl: './budget.scss',
})
export class Budget implements OnInit, OnDestroy {

  plans: BudgetPlan[] = [];
  selectedPlanId: number | null = null;
  plan: BudgetPlan | null = null;
  incomes: BudgetIncome[] = [];
  rows: BudgetRow[] = [];
  rowAmounts: BudgetRowAmount[] = [];

  accounts: Account[] = [];
  accountTypes: AccountType[] = [];
  typeClasses: TypeClass[] = [];
  assetAccounts: Account[] = [];

  newRowAccountCode: number | null = null;
  saveStatusMessage = 'Up-to-date';
  saveStatusClass: 'saved' | 'uptodate' = 'uptodate';
  private saveStatusTimeoutId: ReturnType<typeof setTimeout> | null = null;

  planningPeriodOptions: { value: PlanningPeriod; label: string }[] = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'bi-weekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  constructor(
    private budgetData: BudgetData,
    private accountsData: AccountsData,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private campfire: Campfire
  ) {}

  ngOnInit(): void {
    this.loadPlans();
    this.loadAccountsAndTypes();
  }

  ngOnDestroy(): void {
    if (this.saveStatusTimeoutId != null) {
      clearTimeout(this.saveStatusTimeoutId);
      this.saveStatusTimeoutId = null;
    }
  }

  private loadAccountsAndTypes(): void {
    this.accountsData.accountsGetAll().subscribe({
      next: (r) => { this.accounts = r; this.computeAssetAccounts(); this.cdr.detectChanges(); },
      error: (e) => this.campfire.errorAlert('Error loading accounts', e),
    });
    this.accountsData.accountTypesGetAll().subscribe({
      next: (r) => { this.accountTypes = r; this.computeAssetAccounts(); this.cdr.detectChanges(); },
      error: (e) => this.campfire.errorAlert('Error loading account types', e),
    });
    this.accountsData.typesClassGetAll().subscribe({
      next: (r) => { this.typeClasses = r; this.computeAssetAccounts(); this.cdr.detectChanges(); },
      error: (e) => this.campfire.errorAlert('Error loading type classes', e),
    });
  }

  private computeAssetAccounts(): void {
    if (!this.accounts.length || !this.accountTypes.length || !this.typeClasses.length) {
      this.assetAccounts = [];
      return;
    }
    const assetClass = this.typeClasses.find((c) => c.class_description === 'Asset');
    if (!assetClass) {
      this.assetAccounts = [];
      return;
    }
    const assetTypeCodes = new Set(
      this.accountTypes.filter((t) => t.type_class === assetClass.class_code).map((t) => t.type_code)
    );
    this.assetAccounts = this.accounts.filter(
      (a) => a.account_active === 'Y' && assetTypeCodes.has(a.account_type)
    );
  }

  loadPlans(): void {
    this.budgetData.getPlans().subscribe({
      next: (r) => { this.plans = r; this.cdr.detectChanges(); },
      error: (e) => this.campfire.errorAlert('Error loading budget plans', e),
    });
  }

  onPlanSelectionChange(planId: number | null): void {
    this.selectedPlanId = planId;
    if (planId == null) {
      this.plan = null;
      this.incomes = [];
      this.rows = [];
      this.rowAmounts = [];
      this.cdr.detectChanges();
    } else {
      this.loadPlanFull(planId);
    }
  }

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
    this.loadPlanFull(planId);
  }

  /** Key: `${account_code}_${income_id}` -> amount. Used to reapply unsaved amounts after reload. */
  private applyPreservedAmounts(preserved: Map<string, number>): void {
    if (!preserved.size) return;
    for (const row of this.rows) {
      for (const inc of this.incomes) {
        const incomeId = inc.income_id ?? 0;
        const key = `${row.account_code}_${incomeId}`;
        const amount = preserved.get(key);
        if (amount !== undefined && row.row_id != null) {
          const a = this.rowAmounts.find((x) => x.row_id === row.row_id && x.income_id === incomeId);
          if (a) a.amount = amount;
          else this.rowAmounts.push({ row_id: row.row_id, income_id: incomeId, amount });
        }
      }
    }
    this.cdr.detectChanges();
  }

  loadPlanFull(planId: number, preservedAmounts?: Map<string, number>): void {
    this.budgetData.getPlanFull(planId).subscribe({
      next: (r: BudgetPlanFull) => {
        this.plan = r.plan;
        this.incomes = r.incomes;
        this.rows = r.rows;
        this.rowAmounts = r.rowAmounts || [];
        if (preservedAmounts?.size) this.applyPreservedAmounts(preservedAmounts);
        this.cdr.detectChanges();
      },
      error: (e) => this.campfire.errorAlert('Error loading budget plan', e),
    });
  }

  getAmount(row_id: number, income_id: number): number {
    const a = this.rowAmounts.find((x) => x.row_id === row_id && x.income_id === income_id);
    return a ? a.amount : 0;
  }

  setAmount(row_id: number, income_id: number, value: number): void {
    const a = this.rowAmounts.find((x) => x.row_id === row_id && x.income_id === income_id);
    if (a) a.amount = value;
    else this.rowAmounts.push({ row_id, income_id, amount: value });
    this.cdr.detectChanges();
  }

  contribution(income: BudgetIncome): number {
    if (!this.plan) return 0;
    return contributionForIncome(
      income.amount,
      income.interval_type,
      income.interval_count,
      this.plan.planning_period
    );
  }

  spent(income_id: number): number {
    return spentForIncome(income_id, this.rowAmounts);
  }

  /** Remaining to budget for this income (total contribution minus allocated). May be negative when over budget. */
  remainingForIncome(income: BudgetIncome): number {
    const total = this.contribution(income);
    const used = this.spent(income.income_id ?? 0);
    return total > 0 ? total - used : 0;
  }

  rowTotal(row_id: number): number {
    return this.incomes.reduce((sum, inc) => sum + this.getAmount(row_id, inc.income_id!), 0);
  }

  getAccountLabel(account_code: number): string {
    const a = this.accounts.find((x) => x.account_code === account_code);
    return a?.account_selectable ?? String(account_code);
  }

  openAddPlan(): void {
    const ref = this.dialog.open(BudgetPlanAdd, {
      width: '28em',
      disableClose: true,
      panelClass: 'panelBody',
    });
    ref.afterClosed().subscribe((result: { name: string; planning_period: PlanningPeriod } | null) => {
      if (!result) return;
      this.budgetData.createPlan(result.name, result.planning_period).subscribe({
        next: (res) => {
          this.campfire.successAlert('Budget plan added.');
          this.loadPlans();
          this.selectPlan(res.plan_id);
        },
        error: (e) => this.campfire.errorAlert('Error adding budget plan', e),
      });
    });
  }

  openEditPlanName(): void {
    if (!this.plan?.plan_id) return;
    const ref = this.dialog.open(BudgetNameEdit, {
      width: '28em',
      disableClose: true,
      panelClass: 'panelBody',
      data: { title: 'Edit budget plan name', currentName: this.plan.name || '' },
    });
    ref.afterClosed().subscribe((newName: string | null) => {
      if (newName == null) return;
      this.budgetData.updatePlan(this.plan!.plan_id!, newName, this.plan!.planning_period).subscribe({
        next: () => {
          if (this.plan) this.plan.name = newName;
          this.loadPlans();
          this.showSavedStatus();
          this.cdr.detectChanges();
        },
        error: (e) => this.campfire.errorAlert('Error updating plan name', e),
      });
    });
  }

  openEditIncomeName(income: BudgetIncome): void {
    const incomeId = income.income_id ?? 0;
    const ref = this.dialog.open(BudgetNameEdit, {
      width: '28em',
      disableClose: true,
      panelClass: 'panelBody',
      data: { title: 'Edit income source name', currentName: income.name ?? '' },
    });
    ref.afterClosed().subscribe((newName: string | null) => {
      if (newName == null) return;
      this.budgetData
        .updateIncome(incomeId, newName, income.amount, income.interval_type, income.interval_count)
        .subscribe({
          next: () => {
            const inc = this.incomes.find((i) => (i.income_id ?? 0) === incomeId);
            if (inc) inc.name = newName;
            this.showSavedStatus();
            this.cdr.detectChanges();
          },
          error: (e) => this.campfire.errorAlert('Error updating income name', e),
        });
    });
  }

  deleteIncome(income: BudgetIncome): void {
    const incomeId = income.income_id ?? 0;
    const label = income.name || 'Income ' + incomeId;
    const ref = this.dialog.open(Confirmation, {
      data: {
        title: 'Delete income source',
        message: `Delete "${label}"? All amounts allocated from this income will be removed.`,
      },
      disableClose: true,
      panelClass: 'panelBody',
    });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.budgetData.deleteIncome(incomeId).subscribe({
        next: () => {
          this.campfire.successAlert('Income source removed.');
          this.loadPlanFull(this.selectedPlanId!);
          this.showSavedStatus();
        },
        error: (e) => this.campfire.errorAlert('Error removing income source', e),
      });
    });
  }

  duplicatePlan(): void {
    if (!this.plan?.plan_id) return;
    this.budgetData.duplicatePlan(this.plan.plan_id).subscribe({
      next: (res) => {
        this.campfire.successAlert('Budget plan duplicated.');
        this.loadPlans();
        this.selectPlan(res.plan_id);
        this.showSavedStatus();
      },
      error: (e) => this.campfire.errorAlert('Error duplicating plan', e),
    });
  }

  openAddIncome(): void {
    if (!this.selectedPlanId) return;
    const ref = this.dialog.open(BudgetIncomeAdd, {
      width: '28em',
      disableClose: true,
      panelClass: 'panelBody',
    });
    ref.afterClosed().subscribe((result: any) => {
      if (!result) return;
      this.budgetData
        .addIncome(
          this.selectedPlanId!,
          result.name,
          result.amount,
          result.interval_type,
          result.interval_count
        )
        .subscribe({
          next: () => {
            this.campfire.successAlert('Income source added.');
            this.loadPlanFull(this.selectedPlanId!);
            this.showSavedStatus();
          },
          error: (e) => this.campfire.errorAlert('Error adding income', e),
        });
    });
  }

  addRow(): void {
    if (!this.selectedPlanId || this.newRowAccountCode == null) {
      this.campfire.errorAlert('Select an account to add.');
      return;
    }
    if (this.rows.some((r) => r.account_code === this.newRowAccountCode)) {
      this.campfire.errorAlert('This account is already in the plan.');
      return;
    }
    const preserved = this.buildPreservedAmountsSnapshot();
    this.budgetData.addRow(this.selectedPlanId, this.newRowAccountCode).subscribe({
      next: () => {
        this.campfire.successAlert('Budget row added.');
        this.loadPlanFull(this.selectedPlanId!, preserved);
        this.newRowAccountCode = null;
        this.showSavedStatus();
      },
      error: (e) => this.campfire.errorAlert(e?.error?.error || 'Error adding row (account must be Asset type).', e),
    });
  }

  private buildPreservedAmountsSnapshot(): Map<string, number> {
    const map = new Map<string, number>();
    for (const row of this.rows) {
      for (const inc of this.incomes) {
        const incomeId = inc.income_id ?? 0;
        if (row.row_id != null) {
          map.set(`${row.account_code}_${incomeId}`, this.getAmount(row.row_id, incomeId));
        }
      }
    }
    return map;
  }

  removeRow(row_id: number): void {
    this.budgetData.deleteRow(row_id).subscribe({
      next: () => {
        this.campfire.successAlert('Row removed.');
        this.loadPlanFull(this.selectedPlanId!);
        this.showSavedStatus();
      },
      error: (e) => this.campfire.errorAlert('Error removing row', e),
    });
  }

  saveRowAmounts(row_id: number): void {
    if (!this.plan?.plan_id) return;
    const amounts = this.incomes.map((inc) => ({
      income_id: inc.income_id!,
      amount: this.getAmount(row_id, inc.income_id!),
    }));
    this.budgetData.setRowAmounts(row_id, amounts).subscribe({
      next: () => this.showSavedStatus(),
      error: (e) => this.campfire.errorAlert('Error saving amounts', e),
    });
  }

  private showSavedStatus(): void {
    if (this.saveStatusTimeoutId != null) {
      clearTimeout(this.saveStatusTimeoutId);
      this.saveStatusTimeoutId = null;
    }
    this.saveStatusMessage = 'Changes saved';
    this.saveStatusClass = 'saved';
    this.cdr.detectChanges();
    this.saveStatusTimeoutId = setTimeout(() => {
      this.saveStatusMessage = 'Up-to-date';
      this.saveStatusClass = 'uptodate';
      this.saveStatusTimeoutId = null;
      this.cdr.detectChanges();
    }, 2000);
  }

  deletePlan(): void {
    if (!this.plan?.plan_id) return;
    const ref = this.dialog.open(Confirmation, {
      data: {
        title: 'Delete budget plan',
        message: `Delete plan "${this.plan.name}"? This cannot be undone.`,
      },
      disableClose: true,
      panelClass: 'panelBody',
    });
    ref.afterClosed().subscribe((ok: boolean) => {
      if (!ok) return;
      this.budgetData.deletePlan(this.plan!.plan_id!).subscribe({
        next: () => {
          this.campfire.successAlert('Budget plan deleted.');
          window.location.reload();
        },
        error: (e) => this.campfire.errorAlert('Error deleting plan', e),
      });
    });
  }

  updatePlanningPeriod(): void {
    if (!this.plan?.plan_id) return;
    this.budgetData.updatePlan(this.plan.plan_id, this.plan.name, this.plan.planning_period).subscribe({
      next: () => { this.cdr.detectChanges(); this.showSavedStatus(); },
      error: (e) => this.campfire.errorAlert('Error updating planning period', e),
    });
  }
}
