import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';

@Component({
  selector: 'app-confirmation',
  imports: [MatDialogContent, MatDialogActions],
  templateUrl: './confirmation.html',
  styleUrl: './confirmation.scss',
})
export class Confirmation {
  constructor(
    public dialogRef: MatDialogRef<Confirmation>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  formatMessage(msg: string): string {
  return msg.replace(/\n/g, '<br>');
}
}
