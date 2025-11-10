import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountTypes } from './account-types';

describe('AccountTypes', () => {
  let component: AccountTypes;
  let fixture: ComponentFixture<AccountTypes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountTypes]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountTypes);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
