import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { TransactionData } from '../../services/transaction-data';
import { Transaction, TransactionDTO, TransactionPresentable } from '../../types/Transaction';
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
  originalTransactionData: Transaction[] = [];
  transactionList: TransactionPresentable[];
  accountsList: Account[];
  accountTypeList: AccountType[];
  typeClassList: TypeClass[];
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
    this.transactionList = [];
    this.accountsList = [];
    this.accountTypeList = [];
    this.typeClassList = [];
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
        this.transactionList = await this.makeDataPresentable(response);
        this.cdr.detectChanges();
        this.campfire.debug("Loaded transaction data for ledger page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching transaction data`, error);
      }
    });
    this.accountData.accountsGetAll().subscribe({
      next: (response) => {
        this.accountsList = response;
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

}
