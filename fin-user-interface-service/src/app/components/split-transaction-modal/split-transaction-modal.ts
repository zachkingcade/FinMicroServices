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
import { Campfire } from '../../services/campfire';

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
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  form: FormGroup;
  public originalTransaction: PendingTransaction;
  public accountOptions: Account[];
  private accountTypeList: AccountType[];
  private typeClassList: TypeClass[];

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      originalTransaction: PendingTransaction,
      accountOptions: Account[],
      accountTypeList: AccountType[],
      typeClassList: TypeClass[],
    },
    private dialogRef: MatDialogRef<SplitTransactionModal>,
    private formbuilder: FormBuilder,
    private campfire: Campfire
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

  /**
   * Gets splits from forarray, can be called as object
   */
  get splits(): FormArray<SplitGroup> {
    return this.form.get('splits') as FormArray<SplitGroup>;
  }

  /**
   * Adds split row to the table
   */
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

  /**
   * Removes split row from the table
   * @param index which row to remove
   */
  removeSplit(index: number) {
    this.splits.removeAt(index);
  }

  /**
   * Totals split rows' values
   * @returns calculated total 
   */
  total(): number {
    return this.splits.controls
      .map(c => c.get('amount')?.value || 0)
      .reduce((a, b) => a + b, 0);
  }

  /**
   * Determines effect that a debit or credit will have on a provided account
   * @param account_code The account to check effect on
   * @param creditOrDebit Eather the effect being applied is debit or credit
   * @returns positive or negative character to represent effect, undefined if any part of the account package could not be found
   */
  determineEffect(account_code: number, creditOrDebit: "credit" | "debit"): '+' | '-' | undefined {
    let account = this.accountOptions.find(account => account.account_code == account_code);
    if (!account) {
      this.campfire.errorAlert("Account provided not found in account type list.");
      return undefined;
    }

    let accountType = this.accountTypeList.find(type => type.type_code == account!.account_type);
    if (!accountType) {
      this.campfire.errorAlert("Error: account type not found in account type list.");
      return undefined;
    }

    let typeClass = this.typeClassList.find(tclass => tclass.class_code == accountType!.type_class);
    if (!typeClass) {
      this.campfire.errorAlert("Error: account type class not found in type class list.");
      return undefined;
    }

    return creditOrDebit == "credit" ? typeClass!.credit_effect : typeClass!.debit_effect;
  }

  /**
   * Limits entered values to be at most 2 decimal places long
   * @param i The split row to reformat
   */
  limitDecimals(i: number) {
    const ctrl = this.splits.at(i).get('amount');
    if (!ctrl) return;
    let value = ctrl.value?.toString() ?? "";
    if (value.includes(".")) {
      const [intPart, decPart] = value.split(".");
      ctrl.setValue(Number(decPart.length > 2 ? `${intPart}.${decPart.substring(0, 2)}` : value), { emitEvent: false });
    }
  }

  //--------------------------------------------------------------------------------
  // Button Functions
  //--------------------------------------------------------------------------------

  /**
   * Event handler for the user clicking the submit button. This checks that all data has been entered in a valid manner.
   * If it has it will create a transaction DTO object and send it back to the calling page/component
   */
  confirm() {
    const total = this.total();

    if (total !== this.originalTransaction.amount) {
      this.campfire.errorAlert(`Split amounts must add up to ${this.originalTransaction.amount}.`);
      return;
    }

    for (let i = 0; i < this.splits.length; i++) {
      const credit = this.splits.at(i).get("credit")?.value;
      const debit = this.splits.at(i).get("debit")?.value;
      if (!credit || !debit) {
        this.campfire.errorAlert(`All splits must have a credit and debit account`);
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
        notes: notes ? notes : ""
      })
    }

    this.dialogRef.close(results);
  }

  /**
   * Event handler for the user clicking the cancel button. Returns a null to the calling page/component
   */
  cancel() {
    this.dialogRef.close(null);
  }

}