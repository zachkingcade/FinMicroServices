import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, TransactionAddReturn, TransactionDTO } from '../types/Transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionData {

  constructor(private http: HttpClient) { }

  getData(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>("/transaction/getAll");
  }

  getCurrentAccountBalance(accountNumber: number): Observable<number> {
    return this.http.get<number>(`/transaction/analysis/currentbalanceofaccount/${accountNumber}`);
  }

  postNewTransaction(bodyData: TransactionDTO): Observable<TransactionAddReturn>{
    return this.http.post<TransactionAddReturn>("/transaction/add", bodyData);
  }

  

  // postData(data: any): Observable<any> {
  //   return this.http.post<any>(this.apiUrl, data);
  // }

  // Add other methods for PUT, DELETE, etc. as needed
}
