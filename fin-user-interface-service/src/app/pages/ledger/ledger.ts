import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { NavBar } from '../../components/nav-bar/nav-bar';
import { TransactionData } from '../../services/transaction-data';
import { Transaction } from '../../../types/Transaction';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ledger',
  imports: [NavBar,CommonModule],
  templateUrl: './ledger.html',
  styleUrl: './ledger.scss',
})
export class Ledger implements OnInit {
  transactionList: Transaction[];

  constructor(
    private transactionData: TransactionData,
    private cdr: ChangeDetectorRef
  ) {
    this.transactionList = [];
  }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData(): void {
        this.transactionData.getData().subscribe({
          next: (response) => {
            this.transactionList = response;
            this.cdr.detectChanges();
            console.log(response);
          },
          error: (error) => {
            console.error('Error fetching data:', error);
          }
        });
      }

}
