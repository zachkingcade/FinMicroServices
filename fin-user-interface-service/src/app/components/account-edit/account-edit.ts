import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { Account } from '../../types/Account';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Campfire } from '../../services/campfire';

@Component({
  selector: 'app-account-edit',
  imports: [MatSlideToggleModule],
  templateUrl: './account-edit.html',
  styleUrl: './account-edit.scss',
})
export class AccountEdit implements AfterViewInit {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  public originalAccount: Account;
  public activeChangeable: boolean;
  @ViewChild('descriptionInput') descriptionInput!: ElementRef<HTMLInputElement>;
  @ViewChild('notesInput') notesInput!: ElementRef<HTMLInputElement>;
  @ViewChild('activeState') activeState!: MatSlideToggle;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { originalAccount: Account, activeChangeable: boolean },
    private dialogRef: MatDialogRef<AccountEdit>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.originalAccount = this.data.originalAccount;
    this.activeChangeable = this.data.activeChangeable;
  }

  ngAfterViewInit() {
    this.descriptionInput.nativeElement.value = this.originalAccount.account_description;
    this.notesInput.nativeElement.value = this.originalAccount.notes || "";
    this.activeState.checked = this.originalAccount.account_active == 'Y' ? true : false;
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
    changed = changed ? changed : this.descriptionInput.nativeElement.value != this.originalAccount.account_description; 
    changed = changed ? changed : (this.notesInput.nativeElement.value || "") != this.originalAccount.notes;
    changed = changed ? changed : (this.activeState.checked ? 'Y' : 'N') != this.originalAccount.account_active;

    if (changed) {
      let resultingNewAccount: Account = {
        account_code: this.originalAccount.account_code,
        account_type: this.originalAccount.account_type,
        account_selectable: this.originalAccount.account_selectable,
        account_active: this.activeState.checked ? 'Y' : 'N',
        account_description: this.descriptionInput.nativeElement.value,
        notes: this.notesInput.nativeElement.value
      }
      this.dialogRef.close(resultingNewAccount);
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