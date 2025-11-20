import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { AccountsData } from '../../services/accounts-data';
import { AccountType, AccountTypeDTO, AccountTypePresentable } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { ToastrService } from 'ngx-toastr';
import { Campfire } from '../../services/campfire';

@Component({
  selector: 'app-account-types',
  imports: [NavBar, CommonModule, MtxSelectModule],
  templateUrl: './account-types.html',
  styleUrl: './account-types.scss',
})
export class AccountTypes {
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  accountsTypeList: AccountTypePresentable[];
  accountsClassList: TypeClass[];
  @ViewChild('classSelection') classSelection!: MtxSelect;
  @ViewChild('inputDescription') inputDescription!: ElementRef<HTMLInputElement>;
  @ViewChild('inputNotes') inputNotes!: ElementRef<HTMLInputElement>;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------
  constructor(
    private accountsData: AccountsData,
    private cdr: ChangeDetectorRef,
    private campfire: Campfire
  ) {
    this.accountsTypeList = [];
    this.accountsClassList = [];
  }

  //--------------------------------------------------------------------------------
  // Data Functions
  //--------------------------------------------------------------------------------

  /**
   * Life Cycle Hook that runs when the component is first initalized
   */
  ngOnInit(): void {
    this.campfire.debug("Account types page init!");
    this.fetchData();
  }

  /**
   * Fetchs data from the relavent microservices that are needed for this page
   */
  fetchData(): void {
    this.accountsData.accountTypesGetAll().subscribe({
      next: async (response) => {
        this.accountsTypeList = await this.makeDataPresentable(response);
        this.cdr.detectChanges();
        this.campfire.debug("Loaded account type data for account types page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching account type data`, error);
      }
    });
    this.accountsData.typesClassGetAll().subscribe({
      next: async (response) => {
        this.accountsClassList = response;
        this.cdr.detectChanges();
        this.campfire.debug("Loaded type class data for account types page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching type class data`, error);
      }
    });
  }

  /**
   * Takes a list of account types and changes their type_class from the forien key to the type classes description
   * @param list array of account type data to format
   * @returns The formatted array of account type data
   */
  async makeDataPresentable(list: AccountType[]) {
    let classList: TypeClass[] = [];
    let resultingList: AccountTypePresentable[] = [];
    await new Promise<void>((resolve, reject) => {
      this.accountsData.typesClassGetAll().subscribe({
        next: (response) => {
          classList = response;

          for (let item of list) {
            let classObject = classList.find(typeclass => typeclass.class_code == item.type_class)
            if (classObject) {
              let newTypePresentable: AccountTypePresentable = {
                type_code: item.type_code,
                type_class: classObject.class_description,
                type_description: item.type_description,
                notes: item.notes ? item.notes : ""
              }
              resultingList.push(newTypePresentable);
            } else {
              this.campfire.quietError(`Unable to find type class for [${item.type_class}] returned [${classObject}] instead`);
            }
          }
          resolve();
        },
        error: (error) => {
          this.campfire.quietError('Error fetching class data for account types page', error);
          reject();
        }
      })
    });
    return resultingList;
  }

  async submitNewAccountType() {
    let newAccountType: AccountTypeDTO = {
      type_class: this.classSelection.value,
      type_description: this.inputDescription.nativeElement.value,
      notes: this.inputNotes.nativeElement.value
    }
    this.campfire.debug("Sending new account Type", newAccountType)
    if (this.validateNewAccountType(newAccountType)) {
      let response = await this.accountsData.postNewAccountType(newAccountType).subscribe({
        next: (response) => {
          this.fetchData();
          this.campfire.debug("Posted new account type response",response);
          this.resetManualInput();
        },
        error: (error) => {
          this.campfire.errorAlert('Unable to add new account type, something went wrong!', error, newAccountType);
        }
      })
    }
  }

  validateNewAccountType(newData: AccountTypeDTO): boolean {
    let result: boolean = true;
    if (newData.type_class == 0 || newData.type_class == null) {
      this.campfire.errorAlert("Account Type must have a Equation Section.");
      result = false;
    }
    if (newData.type_description == "") {
      this.campfire.errorAlert("Account Type must have a Description.");
      result = false;
    }
    return result;
  }

  //--------------------------------------------------------------------------------
  // UI Functions
  //--------------------------------------------------------------------------------

  resetManualInput() {
    this.campfire.debug("Resetting UI on Account Types Page");
    this.classSelection.value = "";
    this.inputDescription.nativeElement.value = "";
    this.inputNotes.nativeElement.value = "";
  }

}
