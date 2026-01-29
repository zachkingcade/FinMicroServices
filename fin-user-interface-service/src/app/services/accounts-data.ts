import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AccountType, AccountTypeAddReturn, AccountTypeDTO, AccountTypeUpdateReturn } from '../types/AccountType';
import { Account, AccountAddReturn, AccountDTO, AccountUpdateReturn } from '../types/Account';
import { TypeClass } from '../types/TypeClass';
import { Campfire } from './campfire';

@Injectable({
  providedIn: 'root',
})
export class AccountsData {

  constructor(
    private http: HttpClient,
    private campfire: Campfire
  ) { }

  //--------------------------------------------------------------------------------
  // HTTP GET
  //--------------------------------------------------------------------------------

  typesClassGetAll(): Observable<TypeClass[]> {
    this.campfire.debug("Accounts Service Executing HTTP GET /type/class/getall");
    return this.http.get<TypeClass[]>(`/type/class/getall`);
  }

  accountTypesGetAll(): Observable<AccountType[]> {
    this.campfire.debug("Accounts Service Executing HTTP GET /type/getall");
    return this.http.get<AccountType[]>(`/type/getall`);
  }

  accountsGetAll(): Observable<Account[]> {
    this.campfire.debug("Accounts Service Executing HTTP GET /account/getall");
    return this.http.get<Account[]>(`/account/getall`);
  }

  //--------------------------------------------------------------------------------
  // HTTP POST
  //--------------------------------------------------------------------------------

  postNewAccountType(bodyData: AccountTypeDTO): Observable<AccountTypeAddReturn> {
    this.campfire.debug("Accounts Service Executing HTTP POST /type/add");
    return this.http.post<AccountTypeAddReturn>("/type/add", bodyData);
  }

  postNewAccount(bodyData: AccountDTO): Observable<AccountAddReturn> {
    this.campfire.debug("Accounts Service Executing HTTP POST /account/ad");
    return this.http.post<AccountAddReturn>("/account/add", bodyData);
  }

  postUpdateAccountType(bodyData: AccountType): Observable<AccountTypeUpdateReturn> {
    this.campfire.debug("Accounts Service Executing HTTP POST /type/update");
    return this.http.post<AccountTypeUpdateReturn>("/type/update", bodyData);
  }

  postUpdateAccount(bodyData: Account): Observable<AccountUpdateReturn> {
    this.campfire.debug("Accounts Service Executing HTTP POST /account/update");
    console.log(`DEBUGGING:`, bodyData);
    return this.http.post<AccountUpdateReturn>("/account/update", bodyData);
  }

}
