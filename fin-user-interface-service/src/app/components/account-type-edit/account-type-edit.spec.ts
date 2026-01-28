import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountTypeEdit } from './account-type-edit';

describe('AccountTypeEdit', () => {
  let component: AccountTypeEdit;
  let fixture: ComponentFixture<AccountTypeEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountTypeEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountTypeEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
