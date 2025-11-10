import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Transaction } from '../../types/Transaction';

@Injectable({
  providedIn: 'root',
})
export class TransactionData {

  constructor(private http: HttpClient) { }

  getData(): Observable<any[]> {
    return this.http.get<Transaction[]>(`/transaction/getAll/`);
  }

  // postData(data: any): Observable<any> {
  //   return this.http.post<any>(this.apiUrl, data);
  // }

  // Add other methods for PUT, DELETE, etc. as needed
}
