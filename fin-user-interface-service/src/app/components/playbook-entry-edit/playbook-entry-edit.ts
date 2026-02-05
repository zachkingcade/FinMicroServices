import { AfterViewInit, ChangeDetectorRef, Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Campfire } from '../../services/campfire';
import { PlaybookEntry } from '../../types/Transaction';
import { Account } from '../../types/Account';
import { AccountType } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-playbook-entry-edit',
  imports: [CommonModule, MtxSelectModule, FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './playbook-entry-edit.html',
  styleUrl: './playbook-entry-edit.scss',
})
export class PlaybookEntryEdit implements AfterViewInit {

  description: string = "";
  amount: number = 0;
  credit_account: number = 0;
  debit_account: number = 0;
  notes: string = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      entry: PlaybookEntry;
      accountsListSelectable: Account[];
      accountTypeList: AccountType[];
      typeClassList: TypeClass[];
    },
    private dialogRef: MatDialogRef<PlaybookEntryEdit>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.description = this.data.entry.trans_description;
    this.amount = this.data.entry.amount;
    this.credit_account = this.data.entry.credit_account;
    this.debit_account = this.data.entry.debit_account;
    this.notes = this.data.entry.notes || "";
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  determineEffect(account_code: number, creditOrDebit: "credit" | "debit"): '+' | '-' | undefined {
    const account = this.data.accountsListSelectable.find(a => a.account_code === account_code);
    if (!account) return undefined;
    const accountType = this.data.accountTypeList.find(t => t.type_code === account.account_type);
    if (!accountType) return undefined;
    const typeClass = this.data.typeClassList.find(c => c.class_code === accountType.type_class);
    if (!typeClass) return undefined;
    return creditOrDebit === "credit" ? typeClass.credit_effect : typeClass.debit_effect;
  }

  confirm() {
    if (!this.description?.trim()) {
      this.campfire.errorAlert("Description cannot be empty.");
      return;
    }
    if (!this.amount || this.amount <= 0) {
      this.campfire.errorAlert("Amount must be greater than zero.");
      return;
    }
    if (!this.credit_account) {
      this.campfire.errorAlert("Please select a credit account.");
      return;
    }
    if (!this.debit_account) {
      this.campfire.errorAlert("Please select a debit account.");
      return;
    }
    const result: PlaybookEntry & { entry_id: number } = {
      entry_id: this.data.entry.entry_id!,
      playbook_id: this.data.entry.playbook_id,
      trans_description: this.description.trim(),
      amount: Math.abs(this.amount),
      credit_account: this.credit_account,
      debit_account: this.debit_account,
      notes: this.notes || undefined
    };
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
