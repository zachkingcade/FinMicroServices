import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { Account } from '../../../types/Account';
import { AccountType } from '../../../types/AccountType';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Campfire } from '../../../services/campfire';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { TransactionFilterReturnObject, TransactionFilters } from '../../../types/Transaction';

@Component({
  selector: 'app-ledger-filters',
  imports: [MtxSelectModule],
  templateUrl: './ledger-filters.html',
  styleUrl: './ledger-filters.scss',
})
export class LedgerFilters implements AfterViewInit {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  accountsList: Account[];
  accountTypeList: AccountType[];
  transactionFilters: TransactionFilters;

  //HTML view members
  @ViewChild('inputStartDate') inputStartDate!: ElementRef<HTMLInputElement>;
  @ViewChild('inputEndDate') inputEndDate!: ElementRef<HTMLInputElement>;
  @ViewChild('descriptionContainsInput') descriptionContainsInput!: ElementRef<HTMLInputElement>;
  @ViewChild('selectedAccountsInputList') selectedAccountsInputList!: MtxSelect;
  @ViewChild('selectedAccountTypesInputList') selectedAccountTypesInputList!: MtxSelect;
  @ViewChild('notesContainsInput') notesContainsInput!: ElementRef<HTMLInputElement>;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      accountsList: Account[],
      accountTypeList: AccountType[],
      transactionFilters: TransactionFilters
    },
    private dialogRef: MatDialogRef<LedgerFilters>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.accountsList = this.data.accountsList;
    this.accountTypeList = this.data.accountTypeList;
    this.transactionFilters = this.data.transactionFilters;
  }

  ngAfterViewInit() {
    if (this.data.transactionFilters.dateRangeStart) {
      this.inputStartDate.nativeElement.value = this.data.transactionFilters.dateRangeStart.toISOString().split('T')[0];
    }
    if (this.data.transactionFilters.dateRangeEnd) {
      this.inputStartDate.nativeElement.value = this.data.transactionFilters.dateRangeEnd.toISOString().split('T')[0];
    }
    this.descriptionContainsInput.nativeElement.value = this.data.transactionFilters.descriptionContains;
    this.selectedAccountsInputList.value = this.data.transactionFilters.accountsFilter;
    this.selectedAccountTypesInputList.value = this.data.transactionFilters.accountTypesFilter;
    this.notesContainsInput.nativeElement.value = this.data.transactionFilters.notesContains;
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
    const clearObject: TransactionFilterReturnObject = {
      status: "apply",
      transactionFitlers: {
        dateRangeStart: this.inputStartDate.nativeElement.value ? new Date(this.inputStartDate.nativeElement.value) : null,
        dateRangeEnd: this.inputEndDate.nativeElement.value ? new Date(this.inputEndDate.nativeElement.value) : null,
        descriptionContains: this.descriptionContainsInput.nativeElement.value,
        accountsFilter: this.selectedAccountsInputList.value,
        accountTypesFilter: this.selectedAccountTypesInputList.value,
        notesContains: this.notesContainsInput.nativeElement.value
      }
    }
    this.dialogRef.close(clearObject);
  }

  /**
 * Event handler for the user clicking the clear button. Returns a predefined object to the calling page/component
 */
  clear() {
    const clearObject: TransactionFilterReturnObject = {
      status: "clear",
      transactionFitlers: {
        dateRangeStart: new Date(0),
        dateRangeEnd: new Date(0),
        descriptionContains: "",
        accountsFilter: [],
        accountTypesFilter: [],
        notesContains: "",
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
