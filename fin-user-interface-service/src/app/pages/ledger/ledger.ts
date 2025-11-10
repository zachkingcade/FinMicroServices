import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { TransactionData } from '../../services/transaction-data';
import { Transaction, TransactionPresentable } from '../../types/Transaction';
import { CommonModule } from '@angular/common';
import { Account, AccountPresentable } from '../../types/Account';
import { AccountsData } from '../../services/accounts-data';
import { MtxSelect, MtxSelectModule } from '@ng-matero/extensions/select';

@Component({
  selector: 'app-ledger',
  imports: [NavBar, CommonModule, MtxSelectModule],
  templateUrl: './ledger.html',
  styleUrl: './ledger.scss',
})
export class Ledger implements OnInit {
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
    private cdr: ChangeDetectorRef
  ) {
    this.transactionList = [];
    this.accountsList = [];
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.transactionData.getData().subscribe({
      next: async (response) => {
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

  async submitNewTransaction(){
    console.log("Submit new transaction");
    let newTransaction: Transaction = {
      trans_code: 1,
      trans_date: this.inputDate.nativeElement.value,
      trans_description: this.inputDescription.nativeElement.value,
      amount: Number(this.inputAmount.nativeElement.value),
      credit_account: this.creditSelection.value,
      debit_account: this.debitSelection.value,
      notes: this.inputNotes.nativeElement.value
    }
    let response = await this.transactionData.postNewTransaction(newTransaction).subscribe({
      next: (response) => {
        this.fetchData();
        console.log(response);
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      }
    })
  }

}
