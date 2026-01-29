import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { Campfire } from '../../services/campfire';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { PendingTransaction } from '../../types/Transaction';
import { AccountType } from '../../types/AccountType';
import { TransactionData } from '../../services/transaction-data';

@Component({
  selector: 'app-account-type-edit',
  imports: [MatSlideToggleModule],
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
  @ViewChild('activeState') activeState!: MatSlideToggle;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { originalAccountType: AccountType },
    private dialogRef: MatDialogRef<AccountTypeEdit>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.originalAccountType = this.data.originalAccountType;
  }

  ngAfterViewInit() {
    this.descriptionInput.nativeElement.value = this.originalAccountType.type_description;
    this.notesInput.nativeElement.value = this.originalAccountType.notes || "";
    this.activeState.checked = this.originalAccountType.type_active == 'Y' ? true : false;
    this.cdr.detectChanges();
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
    changed = changed ? changed : this.descriptionInput.nativeElement.value != this.originalAccountType.type_description;
    changed = changed ? changed : (this.notesInput.nativeElement.value || "") != this.originalAccountType.notes;
    changed = changed ? changed : (this.activeState.checked ? 'Y' : 'N') != this.originalAccountType.type_active;

    if (changed) {
      let resultingNewAccountType: AccountType = {
        type_code: this.originalAccountType.type_code,
        type_class: this.originalAccountType.type_class,
        type_active: this.activeState.checked ? 'Y' : 'N',
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
