import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { TypeClass } from '../../../types/TypeClass';
import { AccountTypeFilters, AccountTypeFiltersReturn } from '../../../types/AccountType';
import { Campfire } from '../../../services/campfire';
import { MatSlideToggle, MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-account-type-filters-modal',
  imports: [MtxSelectModule, MatSlideToggleModule],
  templateUrl: './account-type-filters-modal.html',
  styleUrl: './account-type-filters-modal.scss',
})
export class AccountTypeFiltersModal implements AfterViewInit{

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  typeClassList: TypeClass[];
  accountTypeFilters: AccountTypeFilters;

  //HTML view members
  @ViewChild('selectedTypeClassInputList') selectedTypeClassInputList!: MtxSelect;
  @ViewChild('descriptionContainsInput') descriptionContainsInput!: ElementRef<HTMLInputElement>;
  @ViewChild('notesContainsInput') notesContainsInput!: ElementRef<HTMLInputElement>;
  @ViewChild('includeInactive') includeInactive!: MatSlideToggle;
  @ViewChild('hideActive') hideActive!: MatSlideToggle;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      typeClassList: TypeClass[],
      accountTypeFilters: AccountTypeFilters
    },
    private dialogRef: MatDialogRef<AccountTypeFiltersModal>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.typeClassList = this.data.typeClassList;
    this.accountTypeFilters = this.data.accountTypeFilters;
  }

  ngAfterViewInit() {
    this.selectedTypeClassInputList.value = this.accountTypeFilters.typeClassFilter;
    this.descriptionContainsInput.nativeElement.value = this.accountTypeFilters.descriptionContains;
    this.notesContainsInput.nativeElement.value = this.accountTypeFilters.notesContains;
    this.includeInactive.checked = this.accountTypeFilters.includeInactive;
    this.hideActive.checked = this.accountTypeFilters.hideActive;
  }

  //--------------------------------------------------------------------------------
    // Button Functions
    //--------------------------------------------------------------------------------
  
    /**
     * Event handler for the user clicking the submit button. Sends data back to the calling page/component if
     * it has been changed from the original data.
     */
    confirm() {
      const clearObject: AccountTypeFiltersReturn = {
        status: "apply",
        accountTypeFilters: {
          typeClassFilter: this.selectedTypeClassInputList.value,
          descriptionContains: this.descriptionContainsInput.nativeElement.value,
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
      const clearObject: AccountTypeFiltersReturn = {
        status: "clear",
        accountTypeFilters: {
          typeClassFilter: null,
          descriptionContains: "",
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
