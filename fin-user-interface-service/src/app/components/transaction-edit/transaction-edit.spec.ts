import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionEdit } from './transaction-edit';

describe('TransactionEdit', () => {
  let component: TransactionEdit;
  let fixture: ComponentFixture<TransactionEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
