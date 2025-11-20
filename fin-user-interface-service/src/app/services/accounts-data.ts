import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountType, AccountTypeAddReturn, AccountTypeDTO } from '../types/AccountType';
import { Account, AccountAddReturn, AccountDTO } from '../types/Account';
import { TypeClass } from '../types/TypeClass';

@Injectable({
  providedIn: 'root',
})
export class AccountsData {

  constructor(private http: HttpClient) { }

  //--------------------------------------------------------------------------------
  // HTTP GET
  //--------------------------------------------------------------------------------

  typesClassGetAll(): Observable<TypeClass[]> {
    return this.http.get<TypeClass[]>(`/type/class/getall`);
  }

  accountTypesGetAll(): Observable<AccountType[]> {
    return this.http.get<AccountType[]>(`/type/getall`);
  }

  accountsGetAll(): Observable<Account[]> {
    return this.http.get<Account[]>(`/account/getall`);
  }

  //--------------------------------------------------------------------------------
  // HTTP POST
  //--------------------------------------------------------------------------------

  postNewAccountType(bodyData: AccountTypeDTO): Observable<AccountTypeAddReturn> {
    return this.http.post<AccountTypeAddReturn>("/type/add", bodyData);
  }

    postNewAccount(bodyData: AccountDTO): Observable<AccountAddReturn> {
    return this.http.post<AccountAddReturn>("/account/add", bodyData);
  }

}
