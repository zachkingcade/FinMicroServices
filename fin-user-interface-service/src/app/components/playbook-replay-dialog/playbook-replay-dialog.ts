import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Campfire } from '../../services/campfire';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-playbook-replay-dialog',
  imports: [CommonModule, FormsModule, MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './playbook-replay-dialog.html',
  styleUrl: './playbook-replay-dialog.scss',
})
export class PlaybookReplayDialog {

  trans_date: string;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { defaultDate: string },
    private dialogRef: MatDialogRef<PlaybookReplayDialog>,
    private campfire: Campfire
  ) {
    this.trans_date = this.data?.defaultDate || this.getTodayYYYYMMDD();
  }

  private getTodayYYYYMMDD(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  confirm() {
    if (!this.trans_date?.trim()) {
      this.campfire.errorAlert("Please select a date.");
      return;
    }
    this.dialogRef.close({ trans_date: this.trans_date });
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
