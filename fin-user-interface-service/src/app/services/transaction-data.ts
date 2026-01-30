import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PendingTransaction, Transaction, TransactionAddReturn, TransactionDTO, UpdateTransactionNotesDTO } from '../types/Transaction';
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

  
}
