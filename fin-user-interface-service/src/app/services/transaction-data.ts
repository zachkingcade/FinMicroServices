import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PendingTransaction, Playbook, PlaybookEntry, PlaybookWithEntries, PlaybookWithEntryCount, Transaction, TransactionAddReturn, TransactionDTO, UpdateTransactionNotesDTO } from '../types/Transaction';
import { Campfire } from './campfire';

@Injectable({
  providedIn: 'root',
})
export class TransactionData {

  constructor(
    private http: HttpClient,
    private campfire: Campfire
  ) { }

  //--------------------------------------------------------------------------------
  // HTTP GET
  //--------------------------------------------------------------------------------

  getAllTransactions(): Observable<Transaction[]> {
    this.campfire.debug("Transactions Service Executing HTTP GET /transaction/getAll");
    return this.http.get<Transaction[]>("/transaction/getAll");
  }

  getAllPendingTransactions(): Observable<PendingTransaction[]> {
    this.campfire.debug("Transactions Service Executing HTTP GET /transaction/pending/getall");
    return this.http.get<PendingTransaction[]>("/transaction/pending/getall");
  }

  getCurrentAccountBalance(accountNumber: number): Observable<number> {
    this.campfire.debug(`Transactions Service Executing HTTP GET /transaction/analysis/currentbalanceofaccount/${accountNumber}`);
    return this.http.get<number>(`/transaction/analysis/currentbalanceofaccount/${accountNumber}`);
  }

  getAllPlaybooks(): Observable<PlaybookWithEntryCount[]> {
    this.campfire.debug("Transactions Service Executing HTTP GET /playbook/getall");
    return this.http.get<PlaybookWithEntryCount[]>("/playbook/getall");
  }

  getPlaybookWithEntries(id: number): Observable<PlaybookWithEntries> {
    this.campfire.debug(`Transactions Service Executing HTTP GET /playbook/get/${id}`);
    return this.http.get<PlaybookWithEntries>(`/playbook/get/${id}`);
  }

  //--------------------------------------------------------------------------------
  // HTTP POST
  //--------------------------------------------------------------------------------

  postNewTransaction(bodyData: TransactionDTO): Observable<TransactionAddReturn> {
    this.campfire.debug("Transactions Service Executing HTTP POST /transaction/add", bodyData);
    return this.http.post<TransactionAddReturn>("/transaction/add", bodyData);
  }

  postNewPendingTransactionsByCsv(csvString: string) {
    this.campfire.debug("Transactions Service Executing HTTP POST /transaction/pending/addbycsv", csvString);
    return this.http.post<TransactionAddReturn>("/transaction/pending/addbycsv", csvString);
  }

  postPendingTransactionsToConvert(transactionsToConvert: Transaction[]) {
    this.campfire.debug("Transactions Service Executing HTTP POST /transaction/pending/convert", transactionsToConvert);
    return this.http.post<TransactionAddReturn>("/transaction/pending/convert", transactionsToConvert);
  }

  postTransactionRemoval(transactionToDelete: Transaction) {
    this.campfire.debug("Transactions Service Executing HTTP POST /transaction/remove", transactionToDelete);
    return this.http.post<TransactionAddReturn>("/transaction/remove", transactionToDelete);
  }

  postPendinngTransactionRemoval(transactionToDelete: PendingTransaction) {
    this.campfire.debug("Transactions Service Executing HTTP POST /transaction/pending/remove", transactionToDelete);
    return this.http.post<TransactionAddReturn>("/transaction/pending/remove", transactionToDelete);
  }

  transactionNotesEdit(transactionNotesEditDTO: UpdateTransactionNotesDTO) {
    this.campfire.debug("Transactions Service Executing HTTP POST /transaction/updateNotes", transactionNotesEditDTO);
    return this.http.post<TransactionAddReturn>("/transaction/updateNotes", transactionNotesEditDTO);
  }

  addPlaybook(name: string): Observable<{ status: string }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/add", { name });
    return this.http.post<{ status: string }>("/playbook/add", { name });
  }

  updatePlaybookName(playbook_id: number, name: string): Observable<{ status: string }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/updateName", { playbook_id, name });
    return this.http.post<{ status: string }>("/playbook/updateName", { playbook_id, name });
  }

  removePlaybook(playbook_id: number): Observable<{ status: string }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/remove", { playbook_id });
    return this.http.post<{ status: string }>("/playbook/remove", { playbook_id });
  }

  addPlaybookEntry(entry: PlaybookEntry): Observable<{ status: string }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/entry/add", entry);
    return this.http.post<{ status: string }>("/playbook/entry/add", entry);
  }

  updatePlaybookEntry(entry: PlaybookEntry & { entry_id: number }): Observable<{ status: string }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/entry/update", entry);
    return this.http.post<{ status: string }>("/playbook/entry/update", entry);
  }

  removePlaybookEntry(entry_id: number): Observable<{ status: string }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/entry/remove", { entry_id });
    return this.http.post<{ status: string }>("/playbook/entry/remove", { entry_id });
  }

  replayPlaybook(playbook_id: number, trans_date: string): Observable<{ status: string; count: number }> {
    this.campfire.debug("Transactions Service Executing HTTP POST /playbook/replay", { playbook_id, trans_date });
    return this.http.post<{ status: string; count: number }>("/playbook/replay", { playbook_id, trans_date });
  }
}
