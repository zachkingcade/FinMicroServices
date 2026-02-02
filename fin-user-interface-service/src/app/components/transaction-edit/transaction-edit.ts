import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { TransactionPresentable } from '../../types/Transaction';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Campfire } from '../../services/campfire';

@Component({
  selector: 'app-transaction-edit',
  imports: [],
  templateUrl: './transaction-edit.html',
  styleUrl: './transaction-edit.scss',
})
export class TransactionEdit implements AfterViewInit {

  //--------------------------------------------------------------------------------
  //Member Varibles
  //--------------------------------------------------------------------------------
  public originalTransaction: TransactionPresentable;
  @ViewChild('notesInput') notesInput!: ElementRef<HTMLInputElement>;

  //--------------------------------------------------------------------------------
  //Class Setup
  //--------------------------------------------------------------------------------

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { originalAccount: TransactionPresentable},
    private dialogRef: MatDialogRef<TransactionEdit>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {
    this.originalTransaction = this.data.originalAccount;
  }

  ngAfterViewInit() {
    this.notesInput.nativeElement.value = this.originalTransaction.notes || "";
    this.cdr.detectChanges();
  }

  //--------------------------------------------------------------------------------
  // Button Functions
  //--------------------------------------------------------------------------------

  /**
   * Event handler for the user clicking the submit button. Sends data back to the calling page/component if
   * it has been changed from the original data.
   */
  confirm() {
    let changed = false;
    changed = (this.notesInput.nativeElement.value || "") != this.originalTransaction.notes;

    if (changed) {
      this.dialogRef.close(this.notesInput.nativeElement.value || "");
    } else {
      this.dialogRef.close();
    }
  }

  /**
   * Event handler for the user clicking the cancel button. Returns a null to the calling page/component
   */
  cancel() {
    this.dialogRef.close(null);
  }
}