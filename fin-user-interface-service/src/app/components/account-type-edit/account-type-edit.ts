import { AfterViewInit, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { Campfire } from '../../services/campfire';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PendingTransaction } from '../../types/Transaction';
import { AccountType } from '../../types/AccountType';
import { TransactionData } from '../../services/transaction-data';

@Component({
  selector: 'app-account-type-edit',
  imports: [],
  templateUrl: './account-type-edit.html',
  styleUrl: './account-type-edit.scss',
})
export class AccountTypeEdit implements AfterViewInit {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  public originalAccountType: AccountType;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('notesInput') notesInput!: ElementRef<HTMLInputElement>;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { originalAccountType: AccountType },
    private dialogRef: MatDialogRef<AccountTypeEdit>,
    private campfire: Campfire,
  ) {
    this.originalAccountType = this.data.originalAccountType;
  }

  ngAfterViewInit() {
    console.log(this.descriptionInput);
    console.log(this.notesInput);
    this.descriptionInput.nativeElement.value = this.originalAccountType.type_description;
    this.notesInput.nativeElement.value = this.originalAccountType.notes || "";
  }

  //--------------------------------------------------------------------------------
  // Button Functions
  //--------------------------------------------------------------------------------

  /**
   * Event handler for the user clicking the submit button. Sends data back to the calling page/component if
   * it has been changed from the original data.
   */
  confirm() {
    let changed = false;
    changed = (this.descriptionInput.nativeElement.value != this.originalAccountType.type_description) || ((this.notesInput.nativeElement.value || "") != this.originalAccountType.notes);

    console.log(`Changed: [${changed}]`);

    if (changed) {
      let resultingNewAccountType: AccountType = {
        type_code: this.originalAccountType.type_code,
        type_class: this.originalAccountType.type_class,
        type_description: this.descriptionInput.nativeElement.value,
        notes: this.notesInput.nativeElement.value
      }
      this.dialogRef.close(resultingNewAccountType);
    } else {
      this.dialogRef.close();
    }
  }

  /**
   * Event handler for the user clicking the cancel button. Returns a null to the calling page/component
   */
  cancel() {
    this.dialogRef.close(null);
  }
}
