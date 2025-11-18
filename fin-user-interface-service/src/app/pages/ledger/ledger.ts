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

@Component({
  selector: 'app-ledger',
  imports: [NavBar, CommonModule, MtxSelectModule, FeatherModule],
  templateUrl: './ledger.html',
  styleUrl: './ledger.scss',
})
export class Ledger implements OnInit {
  originalTransactionData: Transaction[] = [];
  transactionList: TransactionPresentable[];
  accountsList: Account[];
  @ViewChild('inputDate') inputDate!: ElementRef<HTMLInputElement>;
  @ViewChild('inputDescription') inputDescription!: ElementRef<HTMLInputElement>;
  @ViewChild('inputAmount') inputAmount!: ElementRef<HTMLInputElement>;
  @ViewChild('creditSelection') creditSelection!: MtxSelect;
  @ViewChild('debitSelection') debitSelection!: MtxSelect;
  @ViewChild('inputNotes') inputNotes!: ElementRef<HTMLInputElement>;

  constructor(
    private transactionData: TransactionData,
    private accountData: AccountsData,
    private cdr: ChangeDetectorRef,
    private toaster: ToastrService,
    private dialog: MatDialog
  ) {
    this.transactionList = [];
    this.accountsList = [];
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.transactionData.getAllTransactions().subscribe({
      next: async (response) => {
        this.originalTransactionData = response;
        this.transactionList = await this.makeDataPresentable(response);
        this.cdr.detectChanges();
        console.log(response);
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      }
    });
    this.accountData.accountsGetAll().subscribe({
      next: (response) => {
        this.accountsList = response;
        this.cdr.detectChanges();
        console.log(response);
      },
      error: (error) => {
        console.error('Error fetching data:', error);
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

  async submitNewTransaction() {
    console.log("Submit new transaction");
    let newTransaction: TransactionDTO = {
      trans_date: this.inputDate.nativeElement.value,
      trans_description: this.inputDescription.nativeElement.value,
      amount: Number(this.inputAmount.nativeElement.value),
      credit_account: this.creditSelection.value,
      debit_account: this.debitSelection.value,
      notes: this.inputNotes.nativeElement.value
    }
    let proceed: boolean = this.validateNewTransaction(newTransaction);
    if (proceed) {
      let response = await this.transactionData.postNewTransaction(newTransaction).subscribe({
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

  resetManualInput() {
    this.inputDate.nativeElement.value = "";
    this.inputDescription.nativeElement.value = "";
    this.inputAmount.nativeElement.value = "";
    this.creditSelection.value = "";
    this.debitSelection.value = "";
    this.inputNotes.nativeElement.value = "";
  }

  validateNewTransaction(newData: TransactionDTO): boolean {
    let result: boolean = true;
    if (newData.trans_date == "") {
      this.toaster.error("Transaction must have a Date.")
      result = false;
    }
    if (newData.trans_description == "") {
      this.toaster.error("Transaction must have a Description.")
      result = false;
    }
    if (newData.amount == 0 || newData.amount == null) {
      this.toaster.error("Transaction must have an Amount.")
      result = false;
    }
    if (newData.credit_account == 0 || newData.credit_account == null) {
      this.toaster.error("Transaction must have a credit account.")
      result = false;
    }
    if (newData.debit_account == 0 || newData.debit_account == null) {
      this.toaster.error("Transaction must have a debit account.")
      result = false;
    }
    return result;
  }

    confirmDeletion(itemTodeleteCode: number) {
      let itemTodelete: Transaction = this.originalTransactionData.find( item => item.trans_code == itemTodeleteCode)!;
      const itemDescription = `${itemTodelete.trans_date}] [${itemTodelete.trans_description}] [${itemTodelete.amount}`;
      const dialogRef = this.dialog.open(Confirmation, {
        data: {
          title: 'Hold up ✋',
          message: `Are you sure you want to delete [${itemDescription}]? ` +
          "\n\n This can throw off the balance. This cannot be undone."
        }
      });
  
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.transactionData.postTransactionRemoval(itemTodelete).subscribe({
            next: (response) => {
              this.toaster.success(response.status, `Trasaction [${itemDescription}] deleted successfully!`);
              this.fetchData();
            },
            error: (error) => {
              this.toaster.error(`Error deleting transaction [${itemDescription}] : [${error}]`);
            }
          })
        }
      });
    }

}
