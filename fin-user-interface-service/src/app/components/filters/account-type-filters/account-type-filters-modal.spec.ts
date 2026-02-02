import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountTypeFiltersModal } from './account-type-filters-modal';

describe('AccountTypeFilters', () => {
  let component: AccountTypeFiltersModal;
  let fixture: ComponentFixture<AccountTypeFiltersModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountTypeFiltersModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountTypeFiltersModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
