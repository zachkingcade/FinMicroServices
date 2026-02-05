import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PlaybookReplayDialog } from './playbook-replay-dialog';
import { Campfire } from '../../services/campfire';

describe('PlaybookReplayDialog', () => {
  let component: PlaybookReplayDialog;
  let fixture: ComponentFixture<PlaybookReplayDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaybookReplayDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { defaultDate: '2025-01-01' } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: Campfire, useValue: { errorAlert: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaybookReplayDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
