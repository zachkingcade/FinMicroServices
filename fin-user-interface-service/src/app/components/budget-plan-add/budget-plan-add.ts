import { Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Campfire } from '../../services/campfire';
import { PlanningPeriod } from '../../types/Budget';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-budget-plan-add',
  imports: [CommonModule, FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './budget-plan-add.html',
  styleUrl: './budget-plan-add.scss',
})
export class BudgetPlanAdd {

  name = '';
  planning_period: PlanningPeriod = 'monthly';

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  constructor(
    private dialogRef: MatDialogRef<BudgetPlanAdd>,
    private campfire: Campfire
  ) {}

  confirm() {
    const n = this.name?.trim();
    if (!n) {
      this.campfire.errorAlert('Plan name is required.');
      return;
    }
    this.dialogRef.close({ name: n, planning_period: this.planning_period });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
