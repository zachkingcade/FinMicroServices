import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { PendingTransaction } from '../../types/Transaction';
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

  apply() {
    // only grab changed (dirty) rows
    let changed = this.rows.controls
      .filter((g) => g.dirty)
      .map((g) => g.getRawValue()); // {trans_code, credit, debit, notes}

    if (!changed.length) {
      this.toaster.info('No edits to apply.');
      return;
    }

    // TODO: send to your API
    // this.transactionData.applyPending(changed).subscribe({...})

    console.log('changed payload', changed);
    this.toaster.success(`Applied ${changed.length} row(s).`);

    // after successful save, clear dirty flags
    this.rows.markAsPristine();
  }
}
