import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { AccountFilters, AccountFiltersReturn } from '../../../types/Account';
import { AccountType } from '../../../types/AccountType';
import { Campfire } from '../../../services/campfire';

@Component({
  selector: 'app-account-filters-modal',
  imports: [MtxSelectModule, MatSlideToggleModule],
  templateUrl: './account-filters-modal.html',
  styleUrl: './account-filters-modal.scss',
})
export class AccountFiltersModal implements AfterViewInit {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  accountTypeList: AccountType[];
  accountFilters: AccountFilters;

  //HTML view members
  @ViewChild('descriptionContainsInput') descriptionContainsInput!: ElementRef<HTMLInputElement>;
  @ViewChild('selectedaccountTypeInputList') selectedaccountTypeInputList!: MtxSelect;
  @ViewChild('notesContainsInput') notesContainsInput!: ElementRef<HTMLInputElement>;
  @ViewChild('includeInactive') includeInactive!: MatSlideToggle;
  @ViewChild('hideActive') hideActive!: MatSlideToggle;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      accountTypeList: AccountType[],
      accountFilters: AccountFilters
    },
    private dialogRef: MatDialogRef<AccountFiltersModal>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.accountTypeList = this.data.accountTypeList;
    this.accountFilters = this.data.accountFilters;
  }

  ngAfterViewInit() {
    this.descriptionContainsInput.nativeElement.value = this.accountFilters.descriptionContains;
    this.selectedaccountTypeInputList.value = this.accountFilters.accountTypeFilter;
    this.notesContainsInput.nativeElement.value = this.accountFilters.notesContains;
    this.includeInactive.checked = this.accountFilters.includeInactive;
    this.hideActive.checked = this.accountFilters.hideActive;
  }

  //--------------------------------------------------------------------------------
  // Button Functions
  //--------------------------------------------------------------------------------

  /**
   * Event handler for the user clicking the submit button. Sends data back to the calling page/component if
   * it has been changed from the original data.
   */
  confirm() {
    const clearObject: AccountFiltersReturn = {
      status: "apply",
      accountFilters: {
        descriptionContains: this.descriptionContainsInput.nativeElement.value,
        accountTypeFilter: this.selectedaccountTypeInputList.value,
        notesContains: this.notesContainsInput.nativeElement.value,
        includeInactive: this.includeInactive.checked,
        hideActive: this.hideActive.checked
      }
    }
    this.dialogRef.close(clearObject);
  }

  /**
 * Event handler for the user clicking the clear button. Returns a predefined object to the calling page/component
 */
  clear() {
    const clearObject: AccountFiltersReturn = {
      status: "clear",
      accountFilters: {
        descriptionContains: "",
        accountTypeFilter: null,
        notesContains: "",
        includeInactive: false,
        hideActive: false
      }
    }
    this.dialogRef.close(clearObject);
  }

  /**
   * Event handler for the user clicking the cancel button. Returns a null to the calling page/component
   */
  cancel() {
    this.dialogRef.close(null);
  }
}
