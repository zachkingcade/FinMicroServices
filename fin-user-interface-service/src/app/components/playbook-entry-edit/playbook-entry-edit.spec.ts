import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PlaybookEntryEdit } from './playbook-entry-edit';
import { PlaybookEntry } from '../../types/Transaction';
import { Campfire } from '../../services/campfire';

describe('PlaybookEntryEdit', () => {
  let component: PlaybookEntryEdit;
  let fixture: ComponentFixture<PlaybookEntryEdit>;

  const mockEntry: PlaybookEntry & { entry_id: number } = {
    entry_id: 1,
    playbook_id: 1,
    trans_description: 'Test',
    amount: 10,
    credit_account: 1,
    debit_account: 2,
    notes: ''
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaybookEntryEdit],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { entry: mockEntry, accountsListSelectable: [], accountTypeList: [], typeClassList: [] }
        },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: Campfire, useValue: { errorAlert: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaybookEntryEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
