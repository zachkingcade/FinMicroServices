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
  
/**
 * Formats message to allow displaying of newlines given in the provided message
 * @param msg Message to properly format
 * @returns message with new lines replaced with html breaks
 */
formatMessage(msg: string): string {
  return msg.replace(/\n/g, '<br>');
}
}
