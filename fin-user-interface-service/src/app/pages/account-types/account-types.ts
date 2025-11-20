import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { AccountsData } from '../../services/accounts-data';
import { AccountType, AccountTypeDTO, AccountTypePresentable } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { ToastrService } from 'ngx-toastr';

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
    private toaster: ToastrService
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
        console.log(response);
      },
      error: (error) => {
        console.error(`Error fetching account type data: ${error}`);
      }
    });
    this.accountsData.typesClassGetAll().subscribe({
      next: async (response) => {
        this.accountsClassList = response;
        this.cdr.detectChanges();
        console.log(response);
      },
      error: (error) => {
        console.error(`Error fetching type class data: ${error}`);
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
              console.log("Error");
            }
          }
          resolve();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
          reject();
        }
      })
    });
    return resultingList;
  }

  async submitNewAccountType() {
    console.log("Submit new transaction");
    let newAccoountType: AccountTypeDTO = {
      type_class: this.classSelection.value,
      type_description: this.inputDescription.nativeElement.value,
      notes: this.inputNotes.nativeElement.value
    }
    if (this.validateNewAccountType(newAccoountType)) {
      let response = await this.accountsData.postNewAccountType(newAccoountType).subscribe({
        next: (response) => {
          this.fetchData();
          console.log(response);
          this.resetManualInput();
        },
        error: (error) => {
          console.error('Error fetching data:', error);
        }
      })
    }
  }

  validateNewAccountType(newData: AccountTypeDTO): boolean {
    let result: boolean = true;
    if (newData.type_class == 0 || newData.type_class == null) {
      this.toaster.error("Account Type must have a Equation Section.")
      result = false;
    }
    if (newData.type_description == "") {
      this.toaster.error("Account Type must have a Description.")
      result = false;
    }
    return result;
  }

  //--------------------------------------------------------------------------------
  // UI Functions
  //--------------------------------------------------------------------------------

  resetManualInput() {
    this.classSelection.value = "";
    this.inputDescription.nativeElement.value = "";
    this.inputNotes.nativeElement.value = "";
  }

}
