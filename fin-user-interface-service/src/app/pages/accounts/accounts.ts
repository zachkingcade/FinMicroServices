import { ChangeDetectorRef, Component } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { CommonModule } from '@angular/common';
import { Account, AccountPresentable } from '../../types/Account';
import { AccountsData } from '../../services/accounts-data';
import { AccountType } from '../../types/AccountType';

@Component({
  selector: 'app-accounts',
  imports: [NavBar, CommonModule],
  templateUrl: './accounts.html',
  styleUrl: './accounts.scss',
})
export class Accounts {
  accountsList: AccountPresentable[];

  constructor(
    private accountsData: AccountsData,
    private cdr: ChangeDetectorRef
  ) {
    this.accountsList = [];
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
    this.accountsData.accountsGetAll().subscribe({
      next: async (response) => {
        this.accountsList = await this.makeDataPresentable(response);
        this.cdr.detectChanges();
        console.log(response);
      },
      error: (error) => {
        console.error('Error fetching data:', error);
      }
    });
  }

  async makeDataPresentable(list: Account[]) {
      let accountTypeList: AccountType[] = [];
      let resultingList: AccountPresentable[] = [];
      await new Promise<void> ((resolve, reject) => {
        this.accountsData.accountTypesGetAll().subscribe({
          next: (response) => {
            accountTypeList = response;
  
            for (let item of list) {
              let typeObject = accountTypeList.find(type => type.type_code == item.account_type)
              if (typeObject) {
                let newTypePresentable: AccountPresentable = {
                  account_code: item.account_code,
                  account_type: typeObject.type_description,
                  account_description: item.account_description,
                  account_active: item.account_active == "Y"? "Active" : "Inactive",
                  notes: item.notes ? item.notes : ""
                }
                resultingList.push(newTypePresentable);
              } else {
                console.log("Error");
              }
            }
            resolve();
          },
          error: (error) => {
            console.error('Error fetching data:', error);
            reject();
          }
        })
      });
      return resultingList;
    }
}
