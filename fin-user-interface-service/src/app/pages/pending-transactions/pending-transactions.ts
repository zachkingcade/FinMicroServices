import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { PendingTransaction, Transaction } from '../../types/Transaction';
import { TransactionData } from '../../services/transaction-data';
import { AccountsData } from '../../services/accounts-data';
import { ToastrService } from 'ngx-toastr';
import { Account } from '../../types/Account';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';


type RowForm = FormGroup<{
  trans_code: FormControl<number>;
  credit: FormControl<number | null>;
  debit: FormControl<number | null>;
  notes: FormControl<string>;
}>;

interface rowReturnData {
  trans_code: number,
  credit: number,
  debit: number,
  notes?: string,
}

@Component({
  selector: 'app-pending-transactions',
  imports: [NavBar, CommonModule, MtxSelectModule, ReactiveFormsModule],
  templateUrl: './pending-transactions.html',
  styleUrl: './pending-transactions.scss',
})
export class PendingTransactions {
  transactionPendingList: PendingTransaction[];
  accountsList: Account[];
  private formBuilder: FormBuilder;
  tableForm: FormGroup;

  constructor(
    private transactionData: TransactionData,
    private accountData: AccountsData,
    private cdr: ChangeDetectorRef,
    private toaster: ToastrService
  ) {
    this.transactionPendingList = [];
    this.accountsList = [];
    this.formBuilder = inject(FormBuilder);
    this.tableForm = this.formBuilder.group({
      rows: this.formBuilder.array<RowForm>([])
    });
  }

  ngOnInit(): void {
    this.fetchData();
  }


  get rows(): FormArray<RowForm> {
    return this.tableForm.get('rows') as FormArray<RowForm>;
  }

  private buildRows(items: PendingTransaction[]) {
    let arr = items.map((it) =>
      this.formBuilder.group({
        trans_code: this.formBuilder.control(it.trans_code, { nonNullable: true }),
        credit: this.formBuilder.control<number | null>(null),
        debit: this.formBuilder.control<number | null>(null),
        notes: this.formBuilder.control<string>('', { nonNullable: true }),
      })
    ) as RowForm[];

    this.tableForm.setControl('rows', this.formBuilder.array<RowForm>(arr));
    // treat freshly loaded data as "unchanged"
    this.rows.markAsPristine();
  }

  fetchData(): void {
    this.transactionData.getAllPendingTransactions().subscribe({
      next: async (response) => {
        this.transactionPendingList = response;
        this.buildRows(response);
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

  async apply() {
    let changed = this.rows.controls
      .filter((g) => g.dirty)
      .map((g) => g.getRawValue());

    if (!changed.length) {
      this.toaster.info('No edits to apply.');
      return;
    }

    let sanatizedRowData: rowReturnData[] = [];
    for (let row of changed) {
      if (row.trans_code && row.debit && row.credit) {
        sanatizedRowData.push({
          trans_code: row.trans_code,
          credit: row.credit,
          debit: row.debit,
          notes: row.notes ? row.notes : ""
        })
      } else {
        this.toaster.error(`Pending Transactions must have both a credit and a debit before applying. Data missing from trans_code [${row.trans_code}]`);
      }
    }

    // TODO: send to your API
    let newTransactions: Transaction[] = this.constructTransactionsFromChangedData(sanatizedRowData);
    console.log(newTransactions);
    this.transactionData.postPendingTransactionsToConvert(newTransactions).subscribe({
      next: (response) => {
        this.toaster.success(`${response.status}`);
        this.fetchData();
      },
      error: (error) => {
        this.toaster.error(`Error applying pending transaction. Error: ${error}`);
      }
    })
  }

  constructTransactionsFromChangedData(changed: rowReturnData[]): Transaction[] {
    let resultingList: Transaction[] = [];

    for (let row of changed) {
      let originalPendingTransaction = this.transactionPendingList.find(item => item.trans_code == row.trans_code);
      let newTransaction: Transaction = {
        trans_code: row.trans_code,
        trans_date: originalPendingTransaction!.trans_date,
        trans_description: originalPendingTransaction!.trans_description,
        amount: originalPendingTransaction!.amount,
        credit_account: row.credit,
        debit_account: row.debit,
        notes: row.notes
      }
      resultingList.push(newTransaction);
    }
    return resultingList;
  }


}
