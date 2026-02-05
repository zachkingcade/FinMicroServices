import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { BudgetNameEdit } from './budget-name-edit';
import { Campfire } from '../../services/campfire';

describe('BudgetNameEdit', () => {
  let component: BudgetNameEdit;
  let fixture: ComponentFixture<BudgetNameEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BudgetNameEdit],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { title: 'Edit name', currentName: 'Test' } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: Campfire, useValue: { errorAlert: () => {} } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BudgetNameEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
