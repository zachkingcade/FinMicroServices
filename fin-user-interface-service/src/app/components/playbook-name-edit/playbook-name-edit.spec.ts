import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { PlaybookNameEdit } from './playbook-name-edit';
import { Campfire } from '../../services/campfire';

describe('PlaybookNameEdit', () => {
  let component: PlaybookNameEdit;
  let fixture: ComponentFixture<PlaybookNameEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlaybookNameEdit],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: { currentName: 'Test' } },
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { provide: Campfire, useValue: { errorAlert: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlaybookNameEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
