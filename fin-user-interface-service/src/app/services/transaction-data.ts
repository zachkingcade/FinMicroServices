import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PendingTransaction, Transaction, TransactionAddReturn, TransactionDTO } from '../types/Transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionData {

  constructor(private http: HttpClient) { }

  getAllTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>("/transaction/getAll");
  }

  getAllPendingTransactions(): Observable<PendingTransaction[]> {
    return this.http.get<PendingTransaction[]>("/transaction/pending/getall");
  }

  getCurrentAccountBalance(accountNumber: number): Observable<number> {
    return this.http.get<number>(`/transaction/analysis/currentbalanceofaccount/${accountNumber}`);
  }

  postNewTransaction(bodyData: TransactionDTO): Observable<TransactionAddReturn> {
    return this.http.post<TransactionAddReturn>("/transaction/add", bodyData);
  }

  postNewPendingTransactionsByCsv(csvString: string){
    return this.http.post<TransactionAddReturn>("/transaction/pending/addbycsv", csvString);
  }
}
