import { ChangeDetectorRef, Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
import { PendingTransaction, Transaction, TransactionDTO } from '../../types/Transaction';
import { TransactionData } from '../../services/transaction-data';
import { AccountsData } from '../../services/accounts-data';
import { ToastrService } from 'ngx-toastr';
import { Account } from '../../types/Account';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { Confirmation } from '../../components/confirmation/confirmation';
import { AccountType } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';
import { SplitTransactionModal } from '../../components/split-transaction-modal/split-transaction-modal';
import { Campfire } from '../../services/campfire';


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
  imports: [NavBar, CommonModule, MtxSelectModule, ReactiveFormsModule, MatIconModule, FeatherModule],
  templateUrl: './pending-transactions.html',
  styleUrl: './pending-transactions.scss',
})
export class PendingTransactions {
  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  transactionPendingList: PendingTransaction[];
  accountsList: Account[];
  accountTypeList: AccountType[];
  typeClassList: TypeClass[];
  private formBuilder: FormBuilder;
  tableForm: FormGroup;
  currentlySelectedFileName: string = "";
  @ViewChild('fileInput') fileInput!: ElementRef;

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
    this.transactionPendingList = [];
    this.accountsList = [];
    this.accountTypeList = [];
    this.typeClassList = [];
    this.formBuilder = inject(FormBuilder);
    this.tableForm = this.formBuilder.group({
      rows: this.formBuilder.array<RowForm>([])
    });
  }

  //--------------------------------------------------------------------------------
  // Data Functions
  //--------------------------------------------------------------------------------

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
        this.campfire.debug("Loaded pending transaction data for pending transaction page", response);
      },
      error: (error) => {
        this.campfire.errorAlert(`Error fetching pending transaction data`, error);
      }
    });
    this.accountData.accountsGetAll().subscribe({
      next: (response) => {
        this.accountsList = response;
        this.cdr.detectChanges();
        this.campfire.debug("Loaded account data for pending transaction page", response);
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

  async apply() {
    let changed = this.rows.controls
      .filter((g) => g.dirty)
      .map((g) => g.getRawValue());

    if (!changed.length) {
      this.campfire.infoAlert('No edits to apply.');
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
        this.campfire.errorAlert(`Pending Transactions must have both a credit and a debit before applying. Data started but missing from trans_code [${row.trans_code}]`);
      }
    }

    let newTransactions: Transaction[] = this.constructTransactionsFromChangedData(sanatizedRowData);
    this.campfire.debug("Adding new transactions from pending transaction page", newTransactions)
    this.transactionData.postPendingTransactionsToConvert(newTransactions).subscribe({
      next: (response) => {
        this.campfire.successAlert(`${response.status}`);
        this.fetchData();
      },
      error: (error) => {
        this.campfire.errorAlert(`Error applying pending transaction. Error: ${error}`);
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

  onFileSelected(event: any) {
    const file: File = event.target.files[0];

    if (file) {
      this.currentlySelectedFileName = file.name;
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const fileContent = e.target?.result as string;
        let rows = fileContent.split(/\r?\n/).filter(line => line.trim() !== '');
        if (rows[0] == "Date,Description,Original Description,Category,Amount,Status") {
          this.transactionData.postNewPendingTransactionsByCsv(fileContent).subscribe({
            next: (response) => {
              this.campfire.successAlert(response.status, "File Uploaded Successfully");
              this.clearFileInput();
              this.fetchData();
            },
            error: (error) => {
              this.campfire.errorAlert(`Error posting file data`, error);
            }
          })
        } else {
          this.campfire.errorAlert(`Error provided file of an unknown format.`);
        }

      };

      reader.onerror = (e: ProgressEvent<FileReader>) => {
        this.campfire.errorAlert(`Error reading file`, (e.target)!.error!.message);
      };

      reader.readAsText(file);
    }
  }

  //--------------------------------------------------------------------------------
  // UI Functions
  //--------------------------------------------------------------------------------

  clearFileInput() {
    this.fileInput.nativeElement.value = null;
    this.currentlySelectedFileName = "";
    this.cdr.detectChanges();
  }

  confirmDeletion(itemIndex: number) {
    const itemDescription = `${this.transactionPendingList[itemIndex].trans_date}] [${this.transactionPendingList[itemIndex].trans_description}] [${this.transactionPendingList[itemIndex].amount}`;
    const dialogRef = this.dialog.open(Confirmation, {
      data: {
        title: 'Hold up',
        message: `Are you sure you want to delete [${itemDescription}]?`
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.transactionData.postPendinngTransactionRemoval(this.transactionPendingList[itemIndex]).subscribe({
          next: (response) => {
            this.campfire.successAlert(`Pending Trasaction [${itemDescription}] deleted successfully!`, response);
            this.fetchData();
          },
          error: (error) => {
            this.campfire.errorAlert(`Error deleting pending transaction [${itemDescription}]`, error);
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

  openSplitModal(index: number) {
    const original = this.transactionPendingList[index];

    const dialogRef = this.dialog.open(SplitTransactionModal, {
      width: '80vw',
      data: {
        originalTransaction: original,
        accountOptions: this.accountsList,
        accountTypeList: this.accountTypeList,
        typeClassList: this.typeClassList
      },
      disableClose: true,
      panelClass: "panelBody"
    });

    dialogRef.afterClosed().subscribe(async (results: TransactionDTO[]) => {
      if (!results) {
        this.campfire.errorAlert("No changes made!");
        return;
      }

      this.campfire.debug("result from split window return", results);

      for (let newTransaction of results) {
        await new Promise<void>((resolve, reject) => {
          this.transactionData.postNewTransaction(newTransaction).subscribe({
            next: (response) => {
              this.campfire.successAlert(`New Trasaction [${newTransaction.trans_description}] created successfully!`, response);
              resolve();
            },
            error: (error) => {
              this.campfire.errorAlert(`Error with split transaction`, error, newTransaction);
              reject();
            }
          })
        });
      }

      this.transactionData.postPendinngTransactionRemoval(original).subscribe({
        next: (response) => {
          this.campfire.successAlert(`Pending Trasaction [${original.trans_description}] deleted successfully!`, response);
          this.fetchData();
        },
        error: (error) => {
          this.campfire.errorAlert(`Error with deleting pending transaction from split`, error, original);
        }
      })


    });
  }

}
