import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';

import { Playbook } from './playbook';
import { TransactionData } from '../../services/transaction-data';
import { AccountsData } from '../../services/accounts-data';
import { Campfire } from '../../services/campfire';

describe('Playbook', () => {
  let component: Playbook;
  let fixture: ComponentFixture<Playbook>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Playbook],
      providers: [
        { provide: TransactionData, useValue: { getAllPlaybooks: () => ({ subscribe: () => {} }), getPlaybookWithEntries: () => ({ subscribe: () => {} }) } },
        { provide: AccountsData, useValue: { accountsGetAll: () => ({ subscribe: () => {} }), accountTypesGetAll: () => ({ subscribe: () => {} }), typesClassGetAll: () => ({ subscribe: () => {} }) } },
        { provide: Campfire, useValue: { debug: () => {}, errorAlert: () => {}, successAlert: () => {} } },
        { provide: MatDialog, useValue: { open: () => ({ afterClosed: () => ({ subscribe: () => {} }) }) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Playbook);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
