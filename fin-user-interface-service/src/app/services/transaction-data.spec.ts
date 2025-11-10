import { TestBed } from '@angular/core/testing';

import { TransactionData } from './transaction-data';

describe('TransactionData', () => {
  let service: TransactionData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TransactionData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
