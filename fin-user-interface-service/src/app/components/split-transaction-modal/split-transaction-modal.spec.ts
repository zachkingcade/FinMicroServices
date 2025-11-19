import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SplitTransactionModal } from './split-transaction-modal';

describe('SplitTransactionModal', () => {
  let component: SplitTransactionModal;
  let fixture: ComponentFixture<SplitTransactionModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SplitTransactionModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SplitTransactionModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
