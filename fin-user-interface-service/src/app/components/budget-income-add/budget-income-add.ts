import { Component, Inject } from '@angular/core';
import { MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Campfire } from '../../services/campfire';
import { IntervalType } from '../../types/Budget';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-budget-income-add',
  imports: [CommonModule, FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './budget-income-add.html',
  styleUrl: './budget-income-add.scss',
})
export class BudgetIncomeAdd {

  name = '';
  amount = 0;
  interval_type: IntervalType = 'weeks';
  interval_count = 2;

  constructor(
    private dialogRef: MatDialogRef<BudgetIncomeAdd>,
    private campfire: Campfire
  ) {}

  confirm() {
    if (this.amount <= 0 || this.interval_count <= 0) {
      this.campfire.errorAlert('Amount and interval count must be greater than zero.');
      return;
    }
    this.dialogRef.close({
      name: this.name?.trim() || null,
      amount: this.amount,
      interval_type: this.interval_type,
      interval_count: this.interval_count,
    });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
