import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, Inject, ViewChild } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Campfire } from '../../services/campfire';

@Component({
  selector: 'app-playbook-name-edit',
  imports: [MatDialogTitle, MatDialogContent, MatDialogActions],
  templateUrl: './playbook-name-edit.html',
  styleUrl: './playbook-name-edit.scss',
})
export class PlaybookNameEdit implements AfterViewInit {

  @ViewChild('nameInput') nameInput!: ElementRef<HTMLInputElement>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { currentName: string },
    private dialogRef: MatDialogRef<PlaybookNameEdit>,
    private campfire: Campfire,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterViewInit() {
    if (this.nameInput?.nativeElement) {
      this.nameInput.nativeElement.value = this.data.currentName || "";
    }
    this.cdr.detectChanges();
  }

  confirm() {
    const newName = this.nameInput?.nativeElement?.value?.trim() ?? "";
    if (newName) {
      this.dialogRef.close(newName);
    } else {
      this.campfire.errorAlert("Playbook name cannot be empty.");
    }
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
