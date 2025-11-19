import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormArray, FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { DecimalPipe, CommonModule } from '@angular/common';
import { PendingTransaction, Transaction, TransactionDTO } from '../../types/Transaction';
import { Account } from '../../types/Account';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { AccountType } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { ToastrService } from 'ngx-toastr';

type SplitGroup = FormGroup<{
  amount: FormControl<number>;
  credit: FormControl<number | null>;
  debit: FormControl<number | null>;
  notes: FormControl<string | null>;
}>;

@Component({
  selector: 'app-split-transaction-modal',
  imports: [ReactiveFormsModule, DecimalPipe, CommonModule, MtxSelectModule],
  templateUrl: './split-transaction-modal.html',
  styleUrl: './split-transaction-modal.scss',
})
export class SplitTransactionModal {
  form: FormGroup;
  public originalTransaction: PendingTransaction;
  public accountOptions: Account[];
  private accountTypeList: AccountType[];
  private typeClassList: TypeClass[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      originalTransaction: PendingTransaction,
      accountOptions: Account[],
      accountTypeList: AccountType[],
      typeClassList: TypeClass[]
    },
    private dialogRef: MatDialogRef<SplitTransactionModal>,
    private formbuilder: FormBuilder,
    private toaster: ToastrService,
  ) {
    this.form = this.formbuilder.group({
      splits: this.formbuilder.array([])
    });
    this.originalTransaction = this.data.originalTransaction;
    this.accountOptions = this.data.accountOptions;
    this.accountTypeList = this.data.accountTypeList;
    this.typeClassList = this.data.typeClassList;

    // Start with 2 split line
    this.addSplit();
    this.addSplit();
  }

  get splits(): FormArray<SplitGroup> {
    return this.form.get('splits') as FormArray<SplitGroup>;
  }

  addSplit() {
    this.splits.push(
      this.formbuilder.group({
        amount: this.formbuilder.control(0, { nonNullable: true }),
        credit: this.formbuilder.control<number | null>(null),
        debit: this.formbuilder.control<number | null>(null),
        notes: this.formbuilder.control<string | null>(null),
      })
    );
  }

  removeSplit(index: number) {
    this.splits.removeAt(index);
  }

  total(): number {
    return this.splits.controls
      .map(c => c.get('amount')?.value || 0)
      .reduce((a, b) => a + b, 0);
  }

  confirm() {
    const total = this.total();

    if (total !== this.originalTransaction.amount) {
      this.toaster.error(`Split amounts must add up to $${this.originalTransaction.amount}.`);
      return;
    }

    for (let i = 0; i < this.splits.length; i++) {
      const credit = this.splits.at(i).get("credit")?.value;
      const debit = this.splits.at(i).get("debit")?.value;
      if (!credit || !debit) {
        this.toaster.error(`All splits must have a credit and debit account`);
        return;
      }
    }

    let results: TransactionDTO[] = [];
    for (let i = 0; i < this.splits.length; i++) {
      const credit = this.splits.at(i).get("credit")?.value;
      const debit = this.splits.at(i).get("debit")?.value;
      const notes = this.splits.at(i).get("notes")?.value;
      results.push({
        trans_date: this.originalTransaction.trans_date,
        trans_description: this.originalTransaction.trans_description + ` [Split ${i + 1}]`,
        amount: this.total(),
        credit_account: credit!,
        debit_account: debit!,
        notes: notes? notes : ""
      })
    }

    this.dialogRef.close(results);
  }

  cancel() {
    this.dialogRef.close(null);
  }

  determineEffect(account_code: number, creditOrDebit: "credit" | "debit"): '+' | '-' {
    let account = this.accountOptions.find(account => account.account_code == account_code);
    if (!account) {
      console.error("Error: account provided not found in account type list.")
    }

    let accountType = this.accountTypeList.find(type => type.type_code == account!.account_type);
    if (!accountType) {
      console.error("Error: account type not found in account type list.")
    }

    let typeClass = this.typeClassList.find(tclass => tclass.class_code == accountType!.type_class);
    if (!typeClass) {
      console.error("Error: account type class not found in type class list.")
    }

    return creditOrDebit == "credit" ? typeClass!.credit_effect : typeClass!.debit_effect;
  }

  limitDecimals(i: number) {
    const ctrl = this.splits.at(i).get('amount');
    if (!ctrl) return;
    let value = ctrl.value?.toString() ?? "";
    if (value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      ctrl.setValue(Number(decPart.length > 2 ? `${intPart}.${decPart.substring(0, 2)}` : value), { emitEvent: false });
    }
  }

}