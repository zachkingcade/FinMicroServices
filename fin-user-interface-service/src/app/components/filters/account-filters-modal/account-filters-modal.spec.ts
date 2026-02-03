import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountFiltersModal } from './account-filters-modal';

describe('AccountFiltersModal', () => {
  let component: AccountFiltersModal;
  let fixture: ComponentFixture<AccountFiltersModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountFiltersModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountFiltersModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
