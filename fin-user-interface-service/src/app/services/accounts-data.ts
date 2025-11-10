import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountType } from '../types/AccountType';
import { Account } from '../types/Account';
import { TypeClass } from '../types/TypeClass';

@Injectable({
  providedIn: 'root',
})
export class AccountsData {

  constructor(private http: HttpClient) { }

  typesClassGetAll(): Observable<TypeClass[]> {
    return this.http.get<TypeClass[]>(`/type/class/getall`);
  }

  accountTypesGetAll(): Observable<AccountType[]> {
    return this.http.get<AccountType[]>(`/type/getall`);
  }

  accountsGetAll(): Observable<Account[]> {
    return this.http.get<Account[]>(`/account/getall`);
  }

  // postData(data: any): Observable<any> {
  //   return this.http.post<any>(this.apiUrl, data);
  // }

}
