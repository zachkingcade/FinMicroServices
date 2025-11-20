import { ChangeDetectorRef, Component, ElementRef, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { Account, AccountDTO, AccountPresentable } from '../../types/Account';
import { AccountsData } from '../../services/accounts-data';
import { AccountType } from '../../types/AccountType';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { ToastrService } from 'ngx-toastr';
import { TransactionData } from '../../services/transaction-data';
import { Campfire } from '../../services/campfire';

@Component({
  selector: 'app-accounts',
  imports: [NavBar, CommonModule, MtxSelectModule],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class Accounts {
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  accountsList: AccountPresentable[];
  accountTypeList: AccountType[];
  @ViewChild('typeSelection') typeSelection!: MtxSelect;
  @ViewChild('inputDescription') inputDescription!: ElementRef<HTMLInputElement>;
  @ViewChild('inputNotes') inputNotes!: ElementRef<HTMLInputElement>;


  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------
  constructor(
    private accountsData: AccountsData,
    private transactionData: TransactionData,
    private cdr: ChangeDetectorRef,
    private campfire: Campfire
  ) {
    this.accountsList = [];
    this.accountTypeList = [];
  }

  //--------------------------------------------------------------------------------
  // Data Functions
  //--------------------------------------------------------------------------------
  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.accountsData.accountsGetAll().subscribe({
      next: async (response) => {
        this.accountsList = await this.makeDataPresentable(response);
        this.cdr.detectChanges();
        this.campfire.debug("Loaded account data for accounts page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching account data`, error);
      }
    });
    this.accountsData.accountTypesGetAll().subscribe({
      next: async (response) => {
        this.accountTypeList = response;
        this.cdr.detectChanges();
        this.campfire.debug("Loaded account type data for accounts page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching account type data`, error);
      }
    });
  }

  async makeDataPresentable(list: Account[]) {
    let accountTypeList: AccountType[] = [];
    let resultingList: AccountPresentable[] = [];
    await new Promise<void>((resolve, reject) => {
      this.accountsData.accountTypesGetAll().subscribe({
        next: async (response) => {
          accountTypeList = response;

          for (let item of list) {
            let typeObject = accountTypeList.find(type => type.type_code == item.account_type);
            let accountBalance: number = await new Promise<number>((resolve, reject) => {
              this.transactionData.getCurrentAccountBalance(item.account_code).subscribe({
                next: (response) => {
                  this.campfire.debug(`Retrieved Account [${item.account_code}]'s current balance`, response);
                  resolve(response);
                },
                error: (error) => {
                  this.campfire.quietError(`Error fetching current balance for account [${item.account_code}]`, error);
                  reject(null);
                }
              })
            })
            if (typeObject && accountBalance != null) {
              let newTypePresentable: AccountPresentable = {
                account_code: item.account_code,
                account_type: typeObject.type_description,
                account_description: item.account_description,
                balance: accountBalance,
                notes: item.notes ? item.notes : ""
              }
              resultingList.push(newTypePresentable);
            } else {
              this.campfire.quietError("unable to make data presentable on accounts page");
            }
          }
          resolve();
        },
        error: (error) => {
          this.campfire.errorAlert("Unable to fetch account data", error);
          reject();
        }
      })
    });
    return resultingList;
  }

  async submitNewAccount() {
    let newAccount: AccountDTO = {
      account_type: this.typeSelection.value,
      account_description: this.inputDescription.nativeElement.value,
      notes: this.inputNotes.nativeElement.value
    }
    this.campfire.debug("Sending new account", newAccount)
    if (this.validateNewAccount(newAccount)) {
      let response = await this.accountsData.postNewAccount(newAccount).subscribe({
        next: (response) => {
          this.fetchData();
          this.campfire.debug("Posted new account response", response);
          this.resetManualInput();
        },
        error: (error) => {
          this.campfire.errorAlert('Unable to add new account, something went wrong!', error, newAccount);
        }
      })
    }
  }

  validateNewAccount(newData: AccountDTO): boolean {
    let result: boolean = true;
    if (newData.account_description == "") {
      this.campfire.errorAlert("Account must have a Description.")
      result = false;
    }
    if (newData.account_type == 0 || newData.account_type == null) {
      this.campfire.errorAlert("Account must have a Account Type.")
      result = false;
    }
    return result;
  }


  //--------------------------------------------------------------------------------
  // UI Functions
  //--------------------------------------------------------------------------------
  resetManualInput() {
    this.campfire.debug("Resetting UI on Accounts Page");
    this.typeSelection.value = "";
    this.inputDescription.nativeElement.value = "";
    this.inputNotes.nativeElement.value = "";
  }
}
