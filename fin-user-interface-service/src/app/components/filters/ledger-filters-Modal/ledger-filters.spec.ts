import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LedgerFilters } from './ledger-filters';

describe('LedgerFilters', () => {
  let component: LedgerFilters;
  let fixture: ComponentFixture<LedgerFilters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerFilters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerFilters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
