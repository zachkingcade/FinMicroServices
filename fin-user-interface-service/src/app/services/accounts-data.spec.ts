import { TestBed } from '@angular/core/testing';

import { AccountsData } from './accounts-data';

describe('AccountsData', () => {
  let service: AccountsData;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AccountsData);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
