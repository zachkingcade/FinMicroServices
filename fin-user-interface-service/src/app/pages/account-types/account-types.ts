import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { AccountsData } from '../../services/accounts-data';
import { AccountType, AccountTypeDTO, AccountTypeFilters, AccountTypeFiltersReturn, AccountTypePresentable } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { ToastrService } from 'ngx-toastr';
import { Campfire } from '../../services/campfire';
import { FeatherModule } from 'angular-feather';
import { AccountTypeEdit } from '../../components/account-type-edit/account-type-edit';
import { MatDialog } from '@angular/material/dialog';
import { AccountTypeFiltersModal } from '../../components/filters/account-type-filters/account-type-filters-modal';

@Component({
  selector: 'app-account-types',
  imports: [NavBar, CommonModule, MtxSelectModule, FeatherModule],
  templateUrl: './account-types.html',
  styleUrl: './account-types.scss',
})
export class AccountTypes {
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  originalAccountTypeList: AccountType[];
  accountsTypeListToShow: AccountTypePresentable[];
  typeClassList: TypeClass[];

  //Sorts and Filter varibles
  sort: string;
  accountTypeFilters!: AccountTypeFilters;

  //HTML view members
  @ViewChild('classSelection') classSelection!: MtxSelect;
  @ViewChild('inputDescription') inputDescription!: ElementRef<HTMLInputElement>;
  @ViewChild('inputNotes') inputNotes!: ElementRef<HTMLInputElement>;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------
  constructor(
    private accountsData: AccountsData,
    private cdr: ChangeDetectorRef,
    private campfire: Campfire,
    private dialog: MatDialog,
  ) {
    this.originalAccountTypeList = [];
    this.accountsTypeListToShow = [];
    this.typeClassList = [];
    this.sort = "Created Order Ascending";
    this.resetDefaultFilters();
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
        this.originalAccountTypeList = response;
        this.preparetypeClassListToShow(response);
        this.campfire.debug("Loaded account type data for account types page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching account type data`, error);
      }
    });
    this.accountsData.typesClassGetAll().subscribe({
      next: async (response) => {
        this.typeClassList = response;
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
                type_active: item.type_active,
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

  private async preparetypeClassListToShow(unpreparedAccountTypeList: AccountType[]) {
    let FilteredTypeClassList =  this.FiltertypeClassList(unpreparedAccountTypeList);
    this.accountsTypeListToShow = await this.makeDataPresentable(FilteredTypeClassList);
    this.sortTable(this.sort);
    this.cdr.detectChanges();
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
          this.campfire.debug("Posted new account type response", response);
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

  private resetDefaultFilters() {
    this.accountTypeFilters = {
      typeClassFilter: null,
      descriptionContains: "",
      notesContains: "",
      includeInactive: false,
      hideActive: false
    };
  }

  public sortTableEventWrapper(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sortTable(selectElement.value);
  }

  private sortTable(sortValue: string) {
    switch (sortValue) {
      case "Created Order Ascending":
        this.accountsTypeListToShow.sort((accountTypeA, accountTypeB) => {
          return accountTypeA.type_code! - accountTypeB.type_code!;
        })
        break;

      case "Created Order Descending":
        this.accountsTypeListToShow.sort((accountTypeA, accountTypeB) => {
          return accountTypeB.type_code! - accountTypeA.type_code!;
        })
        break;

      case "Description Ascending":
        this.accountsTypeListToShow.sort((accountTypeA, accountTypeB) => {
          return accountTypeA.type_description.localeCompare(accountTypeB.type_description);
        })
        break;

      case "Description Descending":
        this.accountsTypeListToShow.sort((accountTypeA, accountTypeB) => {
          return accountTypeB.type_description.localeCompare(accountTypeA.type_description);
        })
        break;

      case "Group By Equation Section":
        this.accountsTypeListToShow.sort((accountTypeA, accountTypeB) => {
          return accountTypeA.type_code! - accountTypeB.type_code!;
        });
        this.accountsTypeListToShow.sort((accountTypeA, accountTypeB) => {
          return accountTypeA.type_class.localeCompare(accountTypeB.type_class);
        });
        break;

      default:
        this.campfire.errorAlert('Internal error unable to sort typeClass table');
        break;
    }
    this.cdr.detectChanges();
  }

  FiltertypeClassList(accountTypeList: AccountType[]): AccountType[] {
    let resultingList: AccountType[] = accountTypeList;

    //Only Including Accounts
    if (this.accountTypeFilters.typeClassFilter != null && this.accountTypeFilters.typeClassFilter.length != 0) {
      resultingList = resultingList.filter((accountType) => {
        let acceptableClass: boolean = false;
        for (let typeClass of this.accountTypeFilters.typeClassFilter!) {
          if (typeClass.class_code == accountType.type_class || typeClass.class_code == accountType.type_class) {
            acceptableClass = true;
          }
        }
        return acceptableClass;
      })
    }

    //description Contains
    if (this.accountTypeFilters.descriptionContains) {
      resultingList = resultingList.filter(accountType => ((accountType.type_description.toLowerCase()).includes(this.accountTypeFilters.descriptionContains.toLowerCase())));
    }

    //Notes Contains
    if (this.accountTypeFilters.notesContains) {
      resultingList = resultingList.filter(accountType => (((accountType.notes || "").toLowerCase()).includes(this.accountTypeFilters.notesContains.toLowerCase())));
    }

    //Include Inactive
    if(!this.accountTypeFilters.includeInactive){
      resultingList = resultingList.filter(accountType => accountType.type_active == 'Y')
    }

    //Hide Active
    if(this.accountTypeFilters.hideActive){
      resultingList = resultingList.filter(accountType => accountType.type_active == 'N')
    }

    return resultingList;
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

  openEditModal(type_code: number) {
    const original = this.accountsTypeListToShow.find(accountType => accountType.type_code! == type_code);

    if (original == undefined) {
      this.campfire.errorAlert(`An Error occured trying to edit account type`);
      this.campfire.quietError(`Error Occured trying to find account type using type_code [${type_code}] in the openEditModal on Accounts Type Page`)
    }

    const dialogRef = this.dialog.open(AccountTypeEdit, {
      width: '50vw',
      data: {
        originalAccountType: original
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(async (result: AccountType) => {
      if (!result) {
        this.campfire.errorAlert("No changes made!");
        return;
      }
      this.campfire.debug("result from Account Type Edit window return", result);

      this.accountsData.postUpdateAccountType(result).subscribe({
        next: (response) => {
          this.campfire.successAlert(`Account type [${original!.type_description}] updated successfully!`, response);
          this.fetchData();
        },
        error: (error) => {
          this.campfire.errorAlert(`Error with updating account type`, error, original);
        }
      })
    });
  }

  openFilterModal() {

    const dialogRef = this.dialog.open(AccountTypeFiltersModal, {
      width: '70em',
      data: {
        typeClassList: this.typeClassList,
        accountTypeFilters: this.accountTypeFilters
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(async (result: AccountTypeFiltersReturn) => {
      if (result == null) {
        this.campfire.errorAlert("No changes made!");
        return;
      }

      if (result.status == "clear") {
        this.resetDefaultFilters();
        this.preparetypeClassListToShow(this.originalAccountTypeList);
      } else if (result.status == "apply") {
        this.accountTypeFilters = result.accountTypeFilters;
        this.preparetypeClassListToShow(this.originalAccountTypeList);
      } else {
        this.campfire.errorAlert("Error: Account Type Filter Screen returned unknown status");
      }

      this.campfire.debug("result from Account Type Filter window return", result);
    });
  }

}
