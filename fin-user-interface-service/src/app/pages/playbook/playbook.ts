import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { FeatherModule } from 'angular-feather';
import { MatDialog } from '@angular/material/dialog';
import { Confirmation } from '../../components/confirmation/confirmation';
import { PlaybookNameEdit } from '../../components/playbook-name-edit/playbook-name-edit';
import { PlaybookEntryEdit } from '../../components/playbook-entry-edit/playbook-entry-edit';
import { PlaybookReplayDialog } from '../../components/playbook-replay-dialog/playbook-replay-dialog';
import { MtxSelectModule } from '@ng-matero/extensions/select';
import { FormsModule } from '@angular/forms';
import { TransactionData } from '../../services/transaction-data';
import { AccountsData } from '../../services/accounts-data';
import { Campfire } from '../../services/campfire';
import { PlaybookEntry, PlaybookWithEntryCount } from '../../types/Transaction';
import { Account } from '../../types/Account';
import { AccountType } from '../../types/AccountType';
import { TypeClass } from '../../types/TypeClass';

@Component({
  selector: 'app-playbook',
  imports: [NavBar, CommonModule, FeatherModule, MtxSelectModule, FormsModule],
  templateUrl: './playbook.html',
  styleUrl: './playbook.scss',
})
export class Playbook implements OnInit {

  playbooksList: PlaybookWithEntryCount[] = [];
  selectedPlaybookId: number | null = null;
  selectedPlaybookEntries: PlaybookEntry[] = [];
  selectedPlaybookName: string = "";
  accountsList: Account[] = [];
  accountsListSelectable: Account[] = [];
  accountTypeList: AccountType[] = [];
  typeClassList: TypeClass[] = [];

  @ViewChild('newPlaybookNameInput') newPlaybookNameInput!: ElementRef<HTMLInputElement>;
  @ViewChild('newEntryDescription') newEntryDescription!: ElementRef<HTMLInputElement>;
  @ViewChild('newEntryAmount') newEntryAmount!: ElementRef<HTMLInputElement>;
  @ViewChild('newEntryNotes') newEntryNotes!: ElementRef<HTMLInputElement>;

  newEntryCreditValue: number | null = null;
  newEntryDebitValue: number | null = null;

  constructor(
    private transactionData: TransactionData,
    private accountData: AccountsData,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private campfire: Campfire
  ) {}

  ngOnInit(): void {
    this.fetchData();
  }

  private removeInactiveAccounts(list: Account[]): Account[] {
    return list.filter(a => a.account_active === 'Y');
  }

  fetchData(): void {
    this.transactionData.getAllPlaybooks().subscribe({
      next: (response) => {
        this.playbooksList = response;
        this.cdr.detectChanges();
        this.campfire.debug("Loaded playbooks", response);
      },
      error: (error) => this.campfire.errorAlert("Error fetching playbooks", error)
    });
    this.accountData.accountsGetAll().subscribe({
      next: (response) => {
        this.accountsList = response;
        this.accountsListSelectable = this.removeInactiveAccounts(response);
        this.cdr.detectChanges();
      },
      error: (error) => this.campfire.errorAlert("Error fetching accounts", error)
    });
    this.accountData.accountTypesGetAll().subscribe({
      next: (response) => { this.accountTypeList = response; },
      error: (error) => this.campfire.errorAlert("Error fetching account types", error)
    });
    this.accountData.typesClassGetAll().subscribe({
      next: (response) => { this.typeClassList = response; },
      error: (error) => this.campfire.errorAlert("Error fetching type classes", error)
    });
    if (this.selectedPlaybookId !== null) {
      this.loadSelectedPlaybookEntries();
    }
  }

  selectPlaybook(playbook: PlaybookWithEntryCount): void {
    this.selectedPlaybookId = playbook.playbook_id ?? null;
    this.selectedPlaybookName = playbook.name;
    this.loadSelectedPlaybookEntries();
    this.cdr.detectChanges();
  }

  private loadSelectedPlaybookEntries(): void {
    if (this.selectedPlaybookId === null) return;
    this.transactionData.getPlaybookWithEntries(this.selectedPlaybookId).subscribe({
      next: (response) => {
        this.selectedPlaybookEntries = response.entries;
        this.selectedPlaybookName = response.playbook.name;
        this.cdr.detectChanges();
      },
      error: (error) => this.campfire.errorAlert("Error loading playbook entries", error)
    });
  }

  clearSelection(): void {
    this.selectedPlaybookId = null;
    this.selectedPlaybookEntries = [];
    this.selectedPlaybookName = "";
    this.cdr.detectChanges();
  }

  submitNewPlaybook(): void {
    const name = this.newPlaybookNameInput?.nativeElement?.value?.trim();
    if (!name) {
      this.campfire.errorAlert("Playbook name cannot be empty.");
      return;
    }
    this.transactionData.addPlaybook(name).subscribe({
      next: () => {
        this.campfire.successAlert("Playbook added.");
        this.newPlaybookNameInput.nativeElement.value = "";
        this.fetchData();
      },
      error: (error) => this.campfire.errorAlert("Error adding playbook", error)
    });
  }

  openEditNameModal(playbook: PlaybookWithEntryCount, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(PlaybookNameEdit, {
      width: '30em',
      data: { currentName: playbook.name },
      disableClose: true,
      panelClass: "panelBody"
    });
    dialogRef.afterClosed().subscribe((newName: string | null) => {
      if (newName && playbook.playbook_id) {
        this.transactionData.updatePlaybookName(playbook.playbook_id, newName).subscribe({
          next: () => {
            this.campfire.successAlert("Playbook name updated.");
            this.fetchData();
            if (this.selectedPlaybookId === playbook.playbook_id) {
              this.selectedPlaybookName = newName;
            }
          },
          error: (error) => this.campfire.errorAlert("Error updating playbook name", error)
        });
      }
    });
  }

  confirmDeletePlaybook(playbook: PlaybookWithEntryCount, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(Confirmation, {
      data: {
        title: 'Hold up',
        message: `Are you sure you want to delete playbook "${playbook.name}"? This will remove all its entries. This cannot be undone.`
      },
      disableClose: true,
      panelClass: "panelBody"
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result && playbook.playbook_id) {
        this.transactionData.removePlaybook(playbook.playbook_id).subscribe({
          next: () => {
            this.campfire.successAlert("Playbook deleted.");
            if (this.selectedPlaybookId === playbook.playbook_id) {
              this.clearSelection();
            }
            this.fetchData();
          },
          error: (error) => this.campfire.errorAlert("Error deleting playbook", error)
        });
      }
    });
  }

  openReplayModal(playbook: PlaybookWithEntryCount, event: Event): void {
    event.stopPropagation();
    const today = new Date();
    const defaultDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const dialogRef = this.dialog.open(PlaybookReplayDialog, {
      width: '30em',
      data: { defaultDate },
      disableClose: true,
      panelClass: "panelBody"
    });
    dialogRef.afterClosed().subscribe((result: { trans_date: string } | null) => {
      if (result && playbook.playbook_id) {
        this.transactionData.replayPlaybook(playbook.playbook_id, result.trans_date).subscribe({
          next: (res) => {
            this.campfire.successAlert(res.status || `Replayed. ${res.count} transaction(s) created.`);
          },
          error: (error) => this.campfire.errorAlert("Error replaying playbook", error)
        });
      }
    });
  }

  submitNewEntry(): void {
    if (this.selectedPlaybookId === null) return;
    const description = this.newEntryDescription?.nativeElement?.value?.trim();
    const amount = Number(this.newEntryAmount?.nativeElement?.value);
    const notes = this.newEntryNotes?.nativeElement?.value?.trim() || undefined;
    if (!description) {
      this.campfire.errorAlert("Description cannot be empty.");
      return;
    }
    if (!amount || amount <= 0) {
      this.campfire.errorAlert("Amount must be greater than zero.");
      return;
    }
    if (this.newEntryCreditValue == null || this.newEntryCreditValue === 0) {
      this.campfire.errorAlert("Please select a credit account.");
      return;
    }
    if (this.newEntryDebitValue == null || this.newEntryDebitValue === 0) {
      this.campfire.errorAlert("Please select a debit account.");
      return;
    }
    const entry: PlaybookEntry = {
      playbook_id: this.selectedPlaybookId,
      trans_description: description,
      amount: Math.abs(amount),
      credit_account: this.newEntryCreditValue,
      debit_account: this.newEntryDebitValue,
      notes
    };
    this.transactionData.addPlaybookEntry(entry).subscribe({
      next: () => {
        this.campfire.successAlert("Entry added.");
        this.newEntryDescription.nativeElement.value = "";
        this.newEntryAmount.nativeElement.value = "";
        this.newEntryNotes.nativeElement.value = "";
        this.newEntryCreditValue = null;
        this.newEntryDebitValue = null;
        this.fetchData();
        this.cdr.detectChanges();
      },
      error: (error) => this.campfire.errorAlert("Error adding entry", error)
    });
  }

  openEditEntryModal(entry: PlaybookEntry, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(PlaybookEntryEdit, {
      width: '50vw',
      data: {
        entry,
        accountsListSelectable: this.accountsListSelectable,
        accountTypeList: this.accountTypeList,
        typeClassList: this.typeClassList
      },
      disableClose: true,
      panelClass: "panelBody"
    });
    dialogRef.afterClosed().subscribe((updated: (PlaybookEntry & { entry_id: number }) | null) => {
      if (updated) {
        this.transactionData.updatePlaybookEntry(updated).subscribe({
          next: () => {
            this.campfire.successAlert("Entry updated.");
            this.loadSelectedPlaybookEntries();
          },
          error: (error) => this.campfire.errorAlert("Error updating entry", error)
        });
      }
    });
  }

  confirmDeleteEntry(entry: PlaybookEntry, event: Event): void {
    event.stopPropagation();
    const dialogRef = this.dialog.open(Confirmation, {
      data: {
        title: 'Hold up',
        message: `Are you sure you want to delete entry "${entry.trans_description}" (${entry.amount})?`
      },
      disableClose: true,
      panelClass: "panelBody"
    });
    dialogRef.afterClosed().subscribe((result: boolean) => {
      if (result && entry.entry_id) {
        this.transactionData.removePlaybookEntry(entry.entry_id).subscribe({
          next: () => {
            this.campfire.successAlert("Entry deleted.");
            this.fetchData();
          },
          error: (error) => this.campfire.errorAlert("Error deleting entry", error)
        });
      }
    });
  }

  determineEffect(account_code: number, creditOrDebit: "credit" | "debit"): '+' | '-' | undefined {
    const account = this.accountsList.find(a => a.account_code === account_code);
    if (!account) return undefined;
    const accountType = this.accountTypeList.find(t => t.type_code === account.account_type);
    if (!accountType) return undefined;
    const typeClass = this.typeClassList.find(c => c.class_code === accountType.type_class);
    if (!typeClass) return undefined;
    return creditOrDebit === "credit" ? typeClass.credit_effect : typeClass.debit_effect;
  }

  getAccountSelectable(account_code: number): string {
    const a = this.accountsList.find(x => x.account_code === account_code);
    return a?.account_selectable ?? String(account_code);
  }
}
