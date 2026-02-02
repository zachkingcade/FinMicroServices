import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { TransactionData } from '../../services/transaction-data';
import { Transaction, TransactionDTO, TransactionFilterReturnObject, TransactionFilters, TransactionPresentable, UpdateTransactionNotesDTO } from '../../types/Transaction';
import { CommonModule } from '@angular/common';
import { Account, AccountPresentable } from '../../types/Account';
import { AccountsData } from '../../services/accounts-data';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';
import { ToastrService } from 'ngx-toastr';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { Confirmation } from '../../components/confirmation/confirmation';
import { Campfire } from '../../services/campfire';
import { AccountType } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { TransactionEdit } from '../../components/transaction-edit/transaction-edit';
import { LedgerFilters } from '../../components/filters/ledger-filters/ledger-filters';

@Component({
  selector: 'app-ledger',
  imports: [NavBar, CommonModule, MtxSelectModule, FeatherModule],
  templateUrl: './ledger.html',
  styleUrl: './ledger.scss',
})
export class Ledger implements OnInit {
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------

  //Data lists
  originalTransactionData: Transaction[];
  TransactionListToShow: TransactionPresentable[];
  accountsList: Account[];
  accountsListSelectable: Account[];
  accountTypeList: AccountType[];
  typeClassList: TypeClass[];

  //Sorts and Filter varibles
  sort: string;
  transactionFilters!: TransactionFilters;


  //HTML view members
  @ViewChild('inputDate') inputDate!: ElementRef<HTMLInputElement>;
  @ViewChild('inputDescription') inputDescription!: ElementRef<HTMLInputElement>;
  @ViewChild('inputAmount') inputAmount!: ElementRef<HTMLInputElement>;
  @ViewChild('creditSelection') creditSelection!: MtxSelect;
  @ViewChild('debitSelection') debitSelection!: MtxSelect;
  @ViewChild('inputNotes') inputNotes!: ElementRef<HTMLInputElement>;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------
  constructor(
    private transactionData: TransactionData,
    private accountData: AccountsData,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private campfire: Campfire
  ) {
    this.originalTransactionData = [];
    this.TransactionListToShow = [];
    this.accountsList = [];
    this.accountsListSelectable = [];
    this.accountTypeList = [];
    this.typeClassList = [];

    //Sort and Filter Defaults
    this.sort = "Date Ascending";
    this.resetDefaultFilters();
  }

  //--------------------------------------------------------------------------------
  // Data Functions
  //--------------------------------------------------------------------------------

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.transactionData.getAllTransactions().subscribe({
      next: async (response) => {
        this.originalTransactionData = response;
        this.prepareTransactionListToShow(response);
        this.campfire.debug("Loaded transaction data for ledger page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching transaction data`, error);
      }
    });
    this.accountData.accountsGetAll().subscribe({
      next: (response) => {
        this.accountsList = response;
        this.accountsListSelectable = this.removeInactiveAccounts(response);
        this.cdr.detectChanges();
        this.campfire.debug("Loaded account data for ledger page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching account data`, error);
      }
    })
    this.accountData.accountTypesGetAll().subscribe({
      next: (response) => {
        this.accountTypeList = response;
        this.campfire.debug("Loaded account type data for pending transaction page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching account type data`, error);
      }
    })
    this.accountData.typesClassGetAll().subscribe({
      next: (response) => {
        this.typeClassList = response;
        this.campfire.debug("Loaded type class data for pending transaction page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching type class data`, error);
      }
    })
  }

  async makeDataPresentable(list: Transaction[]) {
    let accountList: Account[] = [];
    let resultingList: TransactionPresentable[] = [];
    await new Promise<void>((resolve, reject) => {
      this.accountData.accountsGetAll().subscribe({
        next: (response) => {
          accountList = response;

          for (let item of list) {
            let creditObject = accountList.find(account => account.account_code == item.credit_account)
            let debitObject = accountList.find(account => account.account_code == item.debit_account)
            if (creditObject && debitObject) {
              let newTypePresentable: TransactionPresentable = {
                trans_code: item.trans_code,
                trans_date: item.trans_date,
                trans_description: item.trans_description,
                amount: item.amount,
                credit_account: creditObject.account_selectable,
                debit_account: debitObject.account_selectable,
                notes: item.notes ? item.notes : ""
              }
              resultingList.push(newTypePresentable);
            } else {
              this.campfire.quietError(`Unable to find account for either [${item.credit_account}] or [${item.debit_account}] returned [${creditObject}] and [${debitObject}] instead`);
            }
          }
          resolve();
        },
        error: (error) => {
          this.campfire.quietError('Error accounts data for ledger page', error);
          reject();
        }
      })
    });
    return resultingList;
  }

  private async prepareTransactionListToShow(unpreparedTransacitonsList: Transaction[]) {
    let filteredTransactions = this.FilterTransactions(unpreparedTransacitonsList)
    this.TransactionListToShow = await this.makeDataPresentable(filteredTransactions);
    this.sortTable(this.sort);
    this.cdr.detectChanges();
  }

  private removeInactiveAccounts(list: Account[]): Account[] {
    let resultingList: Account[] = [];
    for (let account of list) {
      if (account.account_active == 'Y') {
        resultingList.push(account);
      }
    }
    return resultingList;
  }

  async submitNewTransaction() {
    let newTransaction: TransactionDTO = {
      trans_date: this.inputDate.nativeElement.value,
      trans_description: this.inputDescription.nativeElement.value,
      amount: Number(this.inputAmount.nativeElement.value),
      credit_account: this.creditSelection.value,
      debit_account: this.debitSelection.value,
      notes: this.inputNotes.nativeElement.value
    }
    this.campfire.debug("Sending new transaction", newTransaction)
    let proceed: boolean = this.validateNewTransaction(newTransaction);
    if (proceed) {
      let response = await this.transactionData.postNewTransaction(newTransaction).subscribe({
        next: (response) => {
          this.fetchData();
          this.campfire.debug("Posted new transaction response", response);
          this.resetManualInput();
        },
        error: (error) => {
          this.campfire.errorAlert('Unable to add new transaction, something went wrong!', error, newTransaction);
        }
      })
    }
  }

  validateNewTransaction(newData: TransactionDTO): boolean {
    let result: boolean = true;
    if (newData.trans_date == "") {
      this.campfire.errorAlert("Transaction must have a Date.")
      result = false;
    }
    if (newData.trans_description == "") {
      this.campfire.errorAlert("Transaction must have a Description.")
      result = false;
    }
    if (newData.amount == 0 || newData.amount == null) {
      this.campfire.errorAlert("Transaction must have an Amount.")
      result = false;
    }
    if (newData.credit_account == 0 || newData.credit_account == null) {
      this.campfire.errorAlert("Transaction must have a credit account.")
      result = false;
    }
    if (newData.debit_account == 0 || newData.debit_account == null) {
      this.campfire.errorAlert("Transaction must have a debit account.")
      result = false;
    }
    return result;
  }

  private resetDefaultFilters() {
    this.transactionFilters = {
      dateRangeStart: null,
      dateRangeEnd: null,
      descriptionContains: "",
      accountsFilter: [],
      accountTypesFilter: [],
      notesContains: ""
    };
  }

  public sortTableEventWrapper(event: Event) {
    const selectElement = event.target as HTMLSelectElement;
    this.sortTable(selectElement.value);
  }

  private sortTable(sortValue: string) {
    switch (sortValue) {
      case "Date Ascending":
        this.TransactionListToShow.sort((transactionA, transactionB) => {
          return new Date(transactionA.trans_date).getTime() - new Date(transactionB.trans_date).getTime();
        })
        break;

      case "Date Descending":
        this.TransactionListToShow.sort((transactionA, transactionB) => {
          return new Date(transactionB.trans_date).getTime() - new Date(transactionA.trans_date).getTime();
        })
        break;

      case "Amount (Small to Large)":
        this.TransactionListToShow.sort((transactionA, transactionB) => {
          return transactionA.amount - transactionB.amount;
        })
        break;

      case "Amount (Large to Small)":
        this.TransactionListToShow.sort((transactionA, transactionB) => {
          return transactionB.amount - transactionA.amount;
        })
        break;

      default:
        this.campfire.errorAlert('Internal error unable to sort transaction table');
        break;
    }
    this.cdr.detectChanges();
  }

  FilterTransactions(transactionList: Transaction[]): Transaction[] {
    let resultingList: Transaction[] = transactionList;

    //Date range
    if (this.transactionFilters.dateRangeStart && this.transactionFilters.dateRangeStart != new Date(0)) {
      resultingList = resultingList.filter(transaction => (new Date(transaction.trans_date) >= this.transactionFilters.dateRangeStart!));
    }
    if (this.transactionFilters.dateRangeEnd && this.transactionFilters.dateRangeEnd != new Date(0)) {
      resultingList = resultingList.filter(transaction => (new Date(transaction.trans_date) <= this.transactionFilters.dateRangeEnd!));
    }

    //description Contains
    if (this.transactionFilters.descriptionContains) {
      resultingList = resultingList.filter(transaction => ((transaction.trans_description.toLowerCase()).includes(this.transactionFilters.descriptionContains.toLowerCase())));
    }

    //Only Including Accounts
    if (this.transactionFilters.accountsFilter != null && this.transactionFilters.accountsFilter.length != 0) {
      resultingList = resultingList.filter((transaction) => {
        let acceptableAccount: boolean = false;
        for (let account of this.transactionFilters.accountsFilter) {
          if (transaction.credit_account == account.account_code || transaction.debit_account == account.account_code) {
            acceptableAccount = true;
          }
        }
        return acceptableAccount;
      })
    }

    //Only Including Account Types
    if (this.transactionFilters.accountTypesFilter != null && this.transactionFilters.accountTypesFilter.length != 0) {
      resultingList = resultingList.filter((transaction) => {
        let acceptableAccountType: boolean = false;
        let creditAccount = this.accountsList.find(account => account.account_code == transaction.credit_account);
        let debitAccount = this.accountsList.find(account => account.account_code == transaction.debit_account);
        let creditType = this.accountTypeList.find(accountType => accountType.type_code = creditAccount!.account_type);
        let debitType = this.accountTypeList.find(accountType => accountType.type_code = debitAccount!.account_type);

        for (let accountType of this.transactionFilters.accountTypesFilter) {
          if (creditType?.type_code == accountType.type_code || debitType?.type_code == accountType.type_code) {
            acceptableAccountType = true;
          }
        }
        return acceptableAccountType;
      })
    }

    //Notes Contains
    if (this.transactionFilters.notesContains) {
      resultingList = resultingList.filter(transaction => (((transaction.notes || "").toLowerCase()).includes(this.transactionFilters.notesContains.toLowerCase())));
    }

    return resultingList;
  }


  //--------------------------------------------------------------------------------
  // UI Functions
  //--------------------------------------------------------------------------------

  resetManualInput() {
    this.campfire.debug("Resetting UI on ledger Page");
    this.inputDescription.nativeElement.value = "";
    this.inputAmount.nativeElement.value = "";
    this.creditSelection.value = "";
    this.debitSelection.value = "";
    this.inputNotes.nativeElement.value = "";
  }

  confirmDeletion(itemTodeleteCode: number) {
    let itemTodelete: Transaction = this.originalTransactionData.find(item => item.trans_code == itemTodeleteCode)!;
    const itemDescription = `${itemTodelete.trans_date}] [${itemTodelete.trans_description}] [${itemTodelete.amount}`;
    const dialogRef = this.dialog.open(Confirmation, {
      data: {
        title: 'Hold up',
        message: `Are you sure you want to delete [${itemDescription}]? ` +
          "\n\n This cannot be undone."
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.transactionData.postTransactionRemoval(itemTodelete).subscribe({
          next: (response) => {
            this.campfire.successAlert(`Trasaction [${itemDescription}] deleted successfully!`, response);
            this.fetchData();
          },
          error: (error) => {
            this.campfire.errorAlert(`Error deleting transaction [${itemDescription}]`, error);
          }
        })
      }
    });
  }

  determineEffect(account_code: number, creditOrDebit: "credit" | "debit"): '+' | '-' | undefined {
    let account = this.accountsList.find(account => account.account_code == account_code);
    if (!account) {
      this.campfire.errorAlert("Account provided not found in account type list.");
      return undefined;
    }

    let accountType = this.accountTypeList.find(type => type.type_code == account!.account_type);
    if (!accountType) {
      this.campfire.errorAlert("Error: account type not found in account type list.");
      return undefined;
    }

    let typeClass = this.typeClassList.find(tclass => tclass.class_code == accountType!.type_class);
    if (!typeClass) {
      this.campfire.errorAlert("Error: account type class not found in type class list.");
      return undefined;
    }

    return creditOrDebit == "credit" ? typeClass!.credit_effect : typeClass!.debit_effect;
  }

  openEditModal(trans_code: number) {
    const original = this.TransactionListToShow.find(transaction => transaction.trans_code! == trans_code);

    if (original == undefined) {
      this.campfire.errorAlert(`An Error occured trying to edit account`);
      this.campfire.quietError(`Error Occured trying to find transaction using trans_code [${trans_code}] in the openEditModal on Ledger Page`)
    }

    const dialogRef = this.dialog.open(TransactionEdit, {
      width: '50vw',
      data: {
        originalAccount: original,
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(async (result: string) => {
      if (result == null) {
        this.campfire.errorAlert("No changes made!");
        return;
      }
      this.campfire.debug("result from Account Edit window return", result);

      let newDTO: UpdateTransactionNotesDTO = {
        trans_code: original!.trans_code,
        notes: result
      }

      this.transactionData.transactionNotesEdit(newDTO).subscribe({
        next: (response) => {
          this.campfire.successAlert(`Transaction [${original!.trans_description}] updated successfully!`, response);
          this.fetchData();
        },
        error: (error) => {
          this.campfire.errorAlert(`Error with updating transaction`, error, original);
        }
      })
    });
  }

  openFilterModal() {

    const dialogRef = this.dialog.open(LedgerFilters, {
      width: '70em',
      data: {
        accountsList: this.accountsList,
        accountTypeList: this.accountTypeList,
        transactionFilters: this.transactionFilters
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(async (result: TransactionFilterReturnObject) => {
      if (result == null) {
        this.campfire.errorAlert("No changes made!");
        return;
      }

      if (result.status == "clear") {
        this.resetDefaultFilters();
        this.prepareTransactionListToShow(this.originalTransactionData);
      } else if (result.status == "apply") {
        this.transactionFilters = result.transactionFitlers;
        this.prepareTransactionListToShow(this.originalTransactionData);
      } else {
        this.campfire.errorAlert("Error: Transaction Filter Screen returned unknown status");
      }

      this.campfire.debug("result from Account Edit window return", result);
    });
  }

}
