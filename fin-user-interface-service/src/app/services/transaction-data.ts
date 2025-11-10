import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction, transactionAddReturn } from '../types/Transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionData {

  constructor(private http: HttpClient) { }

  getData(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>("/transaction/getAll");
  }

  postNewTransaction(bodyData: Transaction): Observable<transactionAddReturn>{
    return this.http.post<transactionAddReturn>("/transaction/add", bodyData);
  }

  // postData(data: any): Observable<any> {
  //   return this.http.post<any>(this.apiUrl, data);
  // }

  // Add other methods for PUT, DELETE, etc. as needed
}
