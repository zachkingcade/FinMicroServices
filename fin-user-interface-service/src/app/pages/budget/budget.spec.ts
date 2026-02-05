import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Budget } from './budget';
import { BudgetData } from '../../services/budget-data';
import { AccountsData } from '../../services/accounts-data';
import { Campfire } from '../../services/campfire';

describe('Budget', () => {
  let component: Budget;
  let fixture: ComponentFixture<Budget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Budget],
      providers: [
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } },
        { provide: BudgetData, useValue: { getPlans: () => ({ subscribe: () => {} }), getPlanFull: () => ({ subscribe: () => {} }) } },
        { provide: AccountsData, useValue: { accountsGetAll: () => ({ subscribe: () => {} }), accountTypesGetAll: () => ({ subscribe: () => {} }), typesClassGetAll: () => ({ subscribe: () => {} }) } },
        { provide: Campfire, useValue: { errorAlert: () => {}, successAlert: () => {}, infoAlert: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Budget);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should compute contribution and spent from plan and row amounts', () => {
    component.plan = { plan_id: 1, name: 'Test', planning_period: 'monthly' };
    component.incomes = [
      { income_id: 1, plan_id: 1, amount: 2000, interval_type: 'weeks', interval_count: 2 },
    ];
    component.rowAmounts = [
      { row_id: 10, income_id: 1, amount: 500 },
      { row_id: 11, income_id: 1, amount: 300 },
    ];
    expect(component.contribution(component.incomes[0])).toBeGreaterThan(0);
    expect(component.spent(1)).toBe(800);
    expect(component.rowTotal(10)).toBe(500);
  });

  it('should filter to asset accounts only for add-row dropdown', () => {
    component.accounts = [
      { account_code: 1, account_type: 100, account_active: 'Y', account_selectable: 'Cash' } as any,
      { account_code: 2, account_type: 200, account_active: 'Y', account_selectable: 'Revenue' } as any,
    ];
    component.accountTypes = [
      { type_code: 100, type_class: 1 } as any,
      { type_code: 200, type_class: 2 } as any,
    ];
    component.typeClasses = [
      { class_code: 1, class_description: 'Asset' } as any,
      { class_code: 2, class_description: 'Revenue' } as any,
    ];
    component['computeAssetAccounts']();
    expect(component.assetAccounts.length).toBe(1);
    expect(component.assetAccounts[0].account_code).toBe(1);
  });
});
